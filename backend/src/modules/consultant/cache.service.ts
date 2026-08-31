import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { RULES } from './system-prompt';
import type { KnowledgeVersionDocument } from '../knowledge/schemas/knowledge-version.schema';

export interface Grounding {
  /** El caché vivo, si se pudo usar. */
  cacheName: string | null;
  /** El material en línea, cuando no hay caché. */
  inlineKnowledge: string | null;
  version: number;
}

/**
 * El caché de contexto en Gemini.
 *
 * Aquí está la economía del Consultor. El material son unos 30.000 tokens: sin
 * caché, cada mensaje los paga enteros. Con caché se suben UNA vez y cada
 * pregunta solo paga lo nuevo, con el material a tarifa reducida. Medido: el
 * 100% de la entrada de una pregunta venía del caché.
 *
 * Es una optimización DESECHABLE. Si vence, si falla o si no hay clave, se
 * manda el material en línea. El chat no se cae por un problema de caché.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  /** Una vuelta entera de sesión sin recrearlo. */
  private static readonly TTL_SECONDS = 3600;

  constructor(
    private readonly knowledge: KnowledgeService,
    private readonly config: ConfigService,
  ) {}

  async ground(client: GoogleGenAI): Promise<Grounding | null> {
    const active = await this.knowledge.findActive();
    if (!active) return null;

    const cacheName = await this.ensureCache(client, active);
    return {
      cacheName,
      inlineKnowledge: cacheName ? null : active.markdown,
      version: active.version,
    };
  }

  /** El texto del material activo, para cuando el caché no sirve. */
  async activeMarkdown(): Promise<string | null> {
    const active = await this.knowledge.findActive();
    return active?.markdown ?? null;
  }

  private async ensureCache(
    client: GoogleGenAI,
    active: KnowledgeVersionDocument,
  ): Promise<string | null> {
    // Un margen de cinco minutos: un caché que vence a mitad de la respuesta
    // deja la petición a medias, y eso se ve peor que no cachear.
    const stillFresh =
      active.cacheName &&
      active.cacheExpiresAt &&
      active.cacheExpiresAt.getTime() - Date.now() > 300_000;

    if (stillFresh) return active.cacheName;

    try {
      // El caché se ata al modelo principal. Si más tarde hay que responder
      // con uno de respaldo, ese caché no sirve y se manda todo en línea.
      const [model] = this.config.getOrThrow<string[]>('gemini.chatModels');
      const cache = await client.caches.create({
        model,
        config: {
          /**
           * LAS REGLAS VAN DENTRO DEL CACHÉ, no en cada llamada. No es una
           * elección: Gemini rechaza la petición con un 400 si se manda
           * `systemInstruction` junto a `cachedContent` —«move those values
           * to CachedContent»—. Comprobado contra el API.
           *
           * Lo que cambia por persona y por día (los datos vigentes, sus
           * evaluaciones) no cabe aquí, así que entra como un turno previo
           * de la conversación.
           */
          systemInstruction: RULES,
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `# MATERIAL OFICIAL DEL PROGRAMA\n\n${active.markdown}`,
                },
              ],
            },
          ],
          ttl: `${CacheService.TTL_SECONDS}s`,
        },
      });

      if (!cache.name) return null;

      active.cacheName = cache.name;
      active.cacheExpiresAt = new Date(
        Date.now() + CacheService.TTL_SECONDS * 1000,
      );
      await active.save();

      this.logger.log(
        `Caché de la versión ${active.version}: ${cache.usageMetadata?.totalTokenCount ?? '?'} tokens`,
      );
      return cache.name;
    } catch (error) {
      // Sin caché el chat sigue funcionando, solo cuesta más. Se avisa y se
      // continúa: es lo contrario de una falla que deba detener nada.
      this.logger.warn(
        `No se pudo cachear el material, se manda en línea: ${String(
          error instanceof Error ? error.message : error,
        ).slice(0, 160)}`,
      );
      return null;
    }
  }
}
