import { describe, it, expect } from 'vitest';
import { puntuar } from './scoring';

describe('puntuar', () => {
  it('pred 1:0 real 1:0 en grupos = 10 (todo pleno)', () => {
    expect(puntuar(1, 0, 1, 0, 'grupos').total).toBe(10);
  });
  it('pred 1:0 real 1:0 en eliminacion = 20', () => {
    expect(puntuar(1, 0, 1, 0, 'eliminacion').total).toBe(20);
  });
  it('pred 2:0 real 3:1 en grupos = 6 (resultado 5 + diferencia 1)', () => {
    const d = puntuar(2, 0, 3, 1, 'grupos');
    expect(d).toMatchObject({ resultado: 5, golLocal: 0, golVisitante: 0, diferencia: 1, total: 6 });
  });
  it('pred 2:0 real 3:1 en eliminacion = 12', () => {
    expect(puntuar(2, 0, 3, 1, 'eliminacion').total).toBe(12);
  });
  it('pred 1:1 real 2:2 en grupos = 6 (empate acertado + diferencia 0)', () => {
    expect(puntuar(1, 1, 2, 2, 'grupos').total).toBe(6);
  });
  it('pred 0:2 real 3:1 en grupos = 0 (signo de diferencia opuesto, gana otro)', () => {
    expect(puntuar(0, 2, 3, 1, 'grupos').total).toBe(0);
  });
  it('diferencia exige mismo signo: pred 2:1 real 1:0 = resultado 5 + diferencia 1 = 6', () => {
    expect(puntuar(2, 1, 1, 0, 'grupos').total).toBe(6);
  });
});
