import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ApiError } from '@/lib/api/errors';
import type { Analysis, FilterForm } from '@/lib/api/types';
import { money, percent, shortDate } from '@/lib/format';
import { fetchWithSession } from '@/lib/session/fetch-server';
import { PrintTrigger } from '@/components/filter/print-trigger';

export const metadata: Metadata = { title: 'Filtro de Seguridad' };

const VERDICT_NOTE: Record<string, string> = {
  verde: 'El proyecto pasa el filtro con la información disponible.',
  amarillo: 'El proyecto necesita revisión antes de avanzar.',
  rojo: 'El proyecto no pasa el filtro.',
};

export default async function PrintAnalysis({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let analysis: Analysis;
  let form: FilterForm;
  try {
    [analysis, form] = await Promise.all([
      fetchWithSession<Analysis>(`/filter/${id}`),
      fetchWithSession<FilterForm>('/filter/form'),
    ]);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }

  const { result } = analysis;
  const criterion = (id: string) => form.criteria.find((c) => c.id === id);
  /** La respuesta guardada es un código; en papel va la frase que se eligió. */
  const answerLabel = (criterionId: string, value: string) =>
    criterion(criterionId)?.choices.find((c) => c.value === value)?.label ??
    value;

  return (
    <article className="sheet">
      <PrintTrigger />

      <header className="doc-head">
        <div>
          <p className="doc-eyebrow">Filtro de Seguridad</p>
          <h1 className="doc-title">{analysis.projectName}</h1>
          {analysis.location && <p className="doc-sub">{analysis.location}</p>}
        </div>
        <div className="doc-brand">
          <p>Pensionate con Bienes Raíces</p>
          <p className="doc-date">
            {shortDate.format(new Date(analysis.createdAt))}
          </p>
        </div>
      </header>

      <section className={`doc-verdict doc-verdict--${result.verdict}`}>
        <div className="doc-verdict-score">
          <span className="doc-score">{result.score ?? '—'}</span>
          <span className="doc-score-max">/ 100</span>
        </div>
        <div>
          <p className="doc-verdict-label">{result.label}</p>
          <p className="doc-verdict-note">
            {VERDICT_NOTE[result.verdict] ?? ''} Contestado el{' '}
            {result.confidence}% de la evaluación.
          </p>
          <p className="doc-summary">{result.summary}</p>
        </div>
      </section>

      <section>
        <h2 className="doc-h2">Cómo puntúa cada parte</h2>
        <table className="doc-table">
          <thead>
            <tr>
              <th>Categoría</th>
              <th className="right">Peso</th>
              <th className="right">Contestado</th>
              <th className="right">Puntaje</th>
            </tr>
          </thead>
          <tbody>
            {result.categories.map((category) => (
              <tr key={category.id}>
                <td>{category.name}</td>
                <td className="right nums">{category.weight}%</td>
                <td className="right nums">
                  {category.answered} de {category.total}
                </td>
                <td className="right nums strong">
                  {category.score ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {result.alerts.length > 0 && (
        <section>
          <h2 className="doc-h2">Alertas</h2>
          <ul className="doc-list">
            {result.alerts.map((alert, i) => (
              <li key={i} className="doc-alert">
                {alert.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.nextSteps.length > 0 && (
        <section>
          <h2 className="doc-h2">Qué hacer antes de firmar</h2>
          <ol className="doc-steps">
            {result.nextSteps.map((step) => (
              <li key={step.criterionId}>{step.action}</li>
            ))}
          </ol>
        </section>
      )}

      {analysis.pricing && (
        <section>
          <h2 className="doc-h2">Precio contra la zona</h2>
          <table className="doc-table">
            <tbody>
              <Row label="Precio publicado" value={money(analysis.listedPrice ?? 0)} />
              <Row
                label="Lo que se paga en la zona"
                value={`${money(analysis.pricing.medianPricePerM2)} / m²`}
              />
              <Row
                label="Valor de mercado"
                value={money(analysis.pricing.marketValue)}
              />
              <Row
                label="Costos de entrada"
                value={`− ${money(analysis.pricing.entryCosts)}`}
              />
              <Row
                label="Margen de seguridad"
                value={`− ${money(analysis.pricing.safetyMargin)}`}
              />
              <Row
                label="Tu precio máximo"
                value={money(analysis.pricing.maxPrice)}
                strong
              />
            </tbody>
          </table>
          {analysis.comparables.length > 0 && (
            <p className="doc-note">
              Comparables usados:{' '}
              {analysis.comparables
                .map((c) => `${c.reference} (${c.areaM2} m²)`)
                .join(' · ')}
            </p>
          )}
        </section>
      )}

      <section>
        <h2 className="doc-h2">Lo que se respondió</h2>
        <table className="doc-table doc-table--answers">
          <tbody>
            {Object.entries(analysis.answers).map(([criterionId, answer]) => (
              <tr key={criterionId}>
                <td>{criterion(criterionId)?.question ?? criterionId}</td>
                <td className="right">
                  {answerLabel(criterionId, answer)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <footer className="doc-foot">
        <p>
          Este documento resume una evaluación hecha con la información que se
          tenía el {shortDate.format(new Date(analysis.createdAt))}. No
          reemplaza la revisión jurídica del proyecto ni el estudio de títulos.
        </p>
        <p className="doc-note">
          Confianza de la evaluación: {percent(result.confidence / 100)} ·
          Generado desde la plataforma de Pensionate con Bienes Raíces
        </p>
      </footer>
    </article>
  );
}

function Row({
  label,
  value,
  strong,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <tr className={strong ? 'strong-row' : undefined}>
      <td>{label}</td>
      <td className="right nums">{value}</td>
    </tr>
  );
}
