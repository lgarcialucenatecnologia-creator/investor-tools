import { ITEMS, SECTIONS, itemsFor } from './checklist.criteria';
import { MIN_COVERAGE, evaluate, type Ratings } from './checklist.scoring';

/** Califica todos los ítems que aplican a un tipo con la misma nota. */
const rateAll = (rating: number, type: 'vis' | 'no_vis' = 'no_vis') =>
  Object.fromEntries(
    SECTIONS.flatMap((section) => itemsFor(section, type)).map((item) => [
      item.id,
      rating,
    ]),
  ) as Ratings;

describe('criterios del Check List', () => {
  it('las secciones suman 100', () => {
    expect(SECTIONS.reduce((sum, s) => sum + s.weight, 0)).toBe(100);
  });

  it.each(SECTIONS.map((s) => [s.name, s]))(
    'los ítems de «%s» suman 100',
    (_name, section) => {
      expect(section.items.reduce((sum, i) => sum + i.weight, 0)).toBe(100);
    },
  );

  it('no repite identificadores de ítem', () => {
    const ids = ITEMS.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('tiene 41 ítems para NO VIS y 40 para VIS', () => {
    expect(evaluate('no_vis', {}).total).toBe(41);
    expect(evaluate('vis', {}).total).toBe(40);
  });
});

describe('evaluate', () => {
  it('sin calificaciones no da veredicto ni puntaje', () => {
    const result = evaluate('no_vis', {});
    expect(result.status).toBe('sin_evaluar');
    expect(result.score).toBeNull();
    expect(result.coverage).toBe(0);
  });

  it('traduce 1–5 a 0–100: todo en 5 es 100 y todo en 1 es 0', () => {
    expect(evaluate('no_vis', rateAll(5)).score).toBe(100);
    // Todo en 1 incluye la fiduciaria, así que además no pasa.
    const allOnes = evaluate('no_vis', rateAll(1));
    expect(allOnes.score).toBe(0);
    expect(allOnes.status).toBe('no_pasa');
  });

  it('lo no calificado no cuenta como cero: baja la cobertura', () => {
    const result = evaluate('no_vis', { seguridad_barrio: 5 });
    expect(result.score).toBe(100);
    expect(result.coverage).toBeLessThan(MIN_COVERAGE);
    expect(result.status).toBe('incompleto');
  });

  it('una fiduciaria con 1 o 2 tumba el proyecto aunque todo lo demás sea 5', () => {
    const result = evaluate('no_vis', { ...rateAll(5), tiene_fiduciaria: 2 });
    expect(result.status).toBe('no_pasa');
    expect(result.weakItems[0]).toMatchObject({
      itemId: 'tiene_fiduciaria',
      knockout: true,
    });
  });

  it('el eliminatorio manda incluso con poca cobertura', () => {
    expect(evaluate('no_vis', { tiene_fiduciaria: 1 }).status).toBe('no_pasa');
  });

  it('el ítem de acabados no cuenta en un proyecto VIS', () => {
    const vis = evaluate('vis', { ...rateAll(5, 'vis'), acabados_no_vis: 1 });
    expect(vis.score).toBe(100);
    expect(vis.weakItems).toHaveLength(0);
    expect(vis.coverage).toBe(100);
  });

  it('ignora calificaciones fuera de 1–5 o no enteras', () => {
    const result = evaluate('no_vis', {
      seguridad_barrio: 0,
      transporte: 6,
      topografia: 3.5,
    });
    expect(result.evaluated).toBe(0);
  });

  it.each([
    [5, 'solido'],
    [4, 'solido'],
    [3, 'revisar'],
    [2, 'no_pasa'],
  ] as const)('todo en %i da «%s»', (rating, status) => {
    expect(evaluate('no_vis', rateAll(rating)).status).toBe(status);
  });

  it('todo en 2 con fiduciaria en 5 es débil, no «no pasa»', () => {
    const result = evaluate('no_vis', { ...rateAll(2), tiene_fiduciaria: 5 });
    expect(result.status).toBe('debil');
  });
});
