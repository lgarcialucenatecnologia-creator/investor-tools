import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { GoogleGenAI } from '@google/genai';
import { Model, Types } from 'mongoose';
import { withFallback } from '../../common/resilience/retry';
import { StreamGuard } from '../knowledge/guardrails';
import { FilterService } from '../filter/filter.service';
import { UsersService } from '../users/users.service';
import { CacheService } from './cache.service';
import { buildFreshContext, buildSystemPrompt } from './system-prompt';
import {
  Author,
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';

/** En qué va la espera. Son los pasos REALES, no una barra decorativa. */
export type ChatStep = 'material' | 'preparando' | 'pensando';

/** Lo que sale hacia el navegador, trozo a trozo. */
export type ChatEvent =
  | { type: 'step'; step: ChatStep }
  | { type: 'chunk'; text: string }
  | { type: 'done'; conversationId: string }
  | { type: 'error'; message: string };

@Injectable()
export class ConsultantService {
  private readonly logger = new Logger(ConsultantService.name);
  private client: GoogleGenAI | null = null;

  /**
   * Cuántos mensajes anteriores se mandan de vuelta. El material ya está en
   * el caché; esto es solo el hilo de la charla. Sin tope, una conversación
   * larga acaba costando más que el propio material.
   */
  private static readonly HISTORY = 12;

  constructor(
    @InjectModel(Conversation.name)
    private readonly model: Model<ConversationDocument>,
    private readonly cache: CacheService,
    private readonly filter: FilterService,
    private readonly users: UsersService,
    private readonly config: ConfigService,
  ) {}

  private gemini(): GoogleGenAI {
    if (this.client) return this.client;
    const apiKey = this.config.get<string>('gemini.apiKey');
    if (!apiKey) {
      throw new BadRequestException(
        'El Consultor todavía no está configurado. Avísale al equipo.',
      );
    }
    this.client = new GoogleGenAI({ apiKey });
    return this.client;
  }

  async findAll(userId: string) {
    const rows = await this.model
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ lastMessageAt: -1 })
      .select('title lastMessageAt messages')
      .limit(50)
      .lean()
      .exec();

    return rows.map((row) => ({
      id: String(row._id),
      title: row.title,
      messageCount: row.messages.length,
      lastMessageAt: row.lastMessageAt,
    }));
  }

  async findOne(userId: string, id: string) {
    const row = await this.byId(userId, id);
    return {
      id: row.id,
      title: row.title,
      messages: row.messages.map((message) => ({
        author: message.author,
        text: message.text,
        at: message.at,
      })),
    };
  }

  async remove(userId: string, id: string): Promise<void> {
    const deleted = await this.model
      .findOneAndDelete({
        _id: this.asId(id),
        userId: new Types.ObjectId(userId),
      })
      .exec();
    if (!deleted)
      throw new NotFoundException('No encontramos esa conversación.');
  }

  /**
   * Responde una pregunta, emitiendo la respuesta a medida que llega.
   *
   * Todo lo que sale pasa por el guarda de datos obsoletos. Si aparece un
   * precio vencido, se corta ahí: más vale una respuesta interrumpida que un
   * precio equivocado sobre la mesa.
   */
  /**
   * El nombre de pila, para tutear con naturalidad.
   *
   * Sale del nombre guardado y no del correo: la primera versión decía «Hola,
   * admin» porque partía la dirección por la arroba. A nadie le hablan así.
   */
  private async firstNameOf(userId: string): Promise<string> {
    const user = await this.users.findById(userId).catch(() => null);
    const full = user?.fullName?.trim();
    if (!full) return 'Hola';
    return full.split(/\s+/)[0];
  }

  async *ask(
    userId: string,
    question: string,
    conversationId?: string,
  ): AsyncGenerator<ChatEvent> {
    const firstName = await this.firstNameOf(userId);
    const client = this.gemini();

    /**
     * CADA PASO SE ANUNCIA ANTES DE ESPERARLO, no después. Es la única forma
     * de que la pantalla diga la verdad: si el caché hay que crearlo, quien
     * pregunta ve «preparando el material» DURANTE esos segundos.
     */
    yield { type: 'step', step: 'material' };
    const active = await this.cache.activeVersion();

    if (!active) {
      yield {
        type: 'error',
        message:
          'El Consultor todavía no tiene material activo. El equipo debe activar una versión.',
      };
      return;
    }

    if (this.cache.needsCache(active)) {
      yield { type: 'step', step: 'preparando' };
    }
    const grounding = await this.cache.groundFor(client, active);

    const conversation = conversationId
      ? await this.byId(userId, conversationId)
      : new this.model({
          userId: new Types.ObjectId(userId),
          title: question.slice(0, 90),
          messages: [],
          lastMessageAt: new Date(),
        });

    const history = conversation.messages
      .slice(-ConsultantService.HISTORY)
      .map((message) => ({
        role: message.author === Author.PERSON ? 'user' : 'model',
        parts: [{ text: message.text }],
      }));

    const promptInput = {
      firstName,
      ownData: await this.ownData(userId),
      dynamicFacts: null,
    };

    /**
     * Con caché, las reglas y el material ya están del lado de Gemini y no se
     * pueden acompañar de otra instrucción del sistema. Así que lo fresco
     * —datos vigentes, lo que esta persona ya hizo— entra como el primer
     * turno de la conversación, con un acuse del modelo detrás para que quede
     * como contexto y no como una pregunta a la que deba responder.
     */
    const fresh = buildFreshContext(promptInput);
    const preamble = grounding.cacheName
      ? [
          { role: 'user', parts: [{ text: fresh }] },
          { role: 'model', parts: [{ text: 'Entendido.' }] },
        ]
      : [];

    yield { type: 'step', step: 'pensando' };

    const guard = new StreamGuard();
    let answer = '';
    const models = this.config.getOrThrow<string[]>('gemini.chatModels');

    try {
      /**
       * Si el modelo principal está saturado se pasa al siguiente. Pero el
       * caché está atado al principal, así que en el respaldo hay que mandar
       * el material EN LÍNEA: la respuesta cuesta más y es igual de buena.
       * Preferimos eso a decirle a alguien «vuelve más tarde».
       */
      let answeredWith = models[0];
      const stream = await withFallback(
        models,
        'respuesta del Consultor',
        async (model, isFallback) => {
          answeredWith = model;
          const useCache = Boolean(grounding.cacheName) && !isFallback;
          return client.models.generateContentStream({
            model,
            contents: [
              ...(useCache ? preamble : []),
              ...history,
              { role: 'user', parts: [{ text: question }] },
            ],
            config: {
              ...(useCache
                ? { cachedContent: grounding.cacheName! }
                : {
                    systemInstruction: buildSystemPrompt({
                      ...promptInput,
                      knowledge: await this.materialFor(grounding),
                    }),
                  }),
              // Ni rígido ni suelto: tiene que sonar a persona sin
              // permitirse inventar. Las cifras y las reglas no salen de
              // aquí, salen del material: el margen es de redacción.
              temperature: 0.4,
            },
          });
        },
        {
          attempts: 3,
          baseDelayMs: 1_500,
          onRetry: (m) => this.logger.warn(m),
        },
      );

      for await (const part of stream) {
        const text = part.text;
        if (!text) continue;
        const safe = guard.push(text);
        if (safe) {
          answer += safe;
          yield { type: 'chunk', text: safe };
        }
        if (guard.blocked) break;
      }

      if (!guard.blocked) {
        const rest = guard.flush();
        if (rest) {
          answer += rest;
          yield { type: 'chunk', text: rest };
        }
      }
      if (answeredWith !== models[0]) {
        this.logger.warn(`Respondió con el respaldo: ${answeredWith}`);
      }
    } catch (error) {
      this.logger.error(
        `Fallo al responder: ${String(error instanceof Error ? error.message : error).slice(0, 200)}`,
      );
      // Se dice qué pasó de verdad —el proveedor está saturado— en vez de un
      // «error inesperado» que hace pensar que se rompió la plataforma.
      yield {
        type: 'error',
        message:
          'El servicio de respuestas está con mucha demanda en este momento y no logré conectarme. Tu pregunta no se perdió: vuelve a enviarla en un minuto.',
      };
      return;
    }

    if (guard.blocked) {
      this.logger.warn(`Respuesta bloqueada: ${guard.hits.join(' · ')}`);
      const notice =
        'Me frené a mitad de la respuesta: iba a darte un dato que está vencido y prefiero no hacerlo. Pregúntamelo de nuevo o pídele al equipo la cifra vigente.';
      answer = notice;
      yield { type: 'chunk', text: notice };
    }

    const now = new Date();
    conversation.messages.push(
      {
        author: Author.PERSON,
        text: question,
        knowledgeVersion: null,
        blockedFor: [],
        at: now,
      },
      {
        author: Author.CONSULTANT,
        text: answer,
        knowledgeVersion: grounding.version,
        blockedFor: guard.hits,
        at: now,
      },
    );
    conversation.lastMessageAt = now;
    await conversation.save();

    yield { type: 'done', conversationId: conversation.id };
  }

  /**
   * El material para cuando no se puede usar el caché. Se lee del documento
   * activo, que es la fuente de verdad; el caché solo era un atajo.
   */
  private async materialFor(grounding: {
    inlineKnowledge: string | null;
  }): Promise<string | undefined> {
    if (grounding.inlineKnowledge) return grounding.inlineKnowledge;
    const active = await this.cache.activeMarkdown();
    return active ?? undefined;
  }

  /**
   * Sus propias evaluaciones del Filtro.
   *
   * Esto es lo que hace que sea el Consultor de Luifer y no un buscador con
   * buenos modales: puede decir «tu evaluación de Torre Aralia salió en rojo
   * por falta de fiducia» en vez de hablar en abstracto.
   */
  private async ownData(userId: string): Promise<string | null> {
    const analyses = await this.filter.findAll(userId).catch(() => []);
    if (analyses.length === 0) return null;

    const lines = analyses.slice(0, 8).map((item) => {
      const pieces = [
        `- ${item.projectName}${item.location ? ` (${item.location})` : ''}`,
        `veredicto: ${item.result.label}`,
        `puntaje: ${item.result.score ?? 'sin dato'}`,
        `contestado: ${item.result.confidence}%`,
      ];
      if (item.pricing) {
        pieces.push(
          `precio máximo calculado: $${item.pricing.maxPrice.toLocaleString('es-CO')}`,
        );
      }
      const steps = item.result.nextSteps
        .slice(0, 3)
        .map((step) => step.action)
        .join('; ');
      if (steps) pieces.push(`pendiente: ${steps}`);
      return pieces.join(' · ');
    });

    return `Evaluaciones que hizo en el Filtro de Seguridad:\n${lines.join('\n')}`;
  }

  private asId(id: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('No encontramos esa conversación.');
    }
    return new Types.ObjectId(id);
  }

  private async byId(
    userId: string,
    id: string,
  ): Promise<ConversationDocument> {
    const row = await this.model
      .findOne({ _id: this.asId(id), userId: new Types.ObjectId(userId) })
      .exec();
    if (!row) throw new NotFoundException('No encontramos esa conversación.');
    return row;
  }
}
