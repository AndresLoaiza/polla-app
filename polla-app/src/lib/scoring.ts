import type { Fase, Desglose } from '../types';

const signo = (n: number): -1 | 0 | 1 => (n > 0 ? 1 : n < 0 ? -1 : 0);

/** Puntaje del reglamento. pl/pv = predicho, al/av = real. */
export function puntuar(pl: number, pv: number, al: number, av: number, fase: Fase): Desglose {
  const m = fase === 'eliminacion' ? 2 : 1;
  const resultado = signo(pl - pv) === signo(al - av) ? 5 * m : 0;
  const golLocal = pl === al ? 2 * m : 0;
  const golVisitante = pv === av ? 2 * m : 0;
  const diferencia = pl - pv === al - av ? 1 * m : 0;
  return { resultado, golLocal, golVisitante, diferencia, total: resultado + golLocal + golVisitante + diferencia };
}
