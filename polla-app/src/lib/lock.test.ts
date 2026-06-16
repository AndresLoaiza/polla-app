import { describe, it, expect } from 'vitest';
import { estaBloqueado, rivalRevelado, msAlCierre, LOCK_MS } from './lock';

const inicio = '2026-06-16T18:00:00Z';

describe('lock', () => {
  it('LOCK_MS son 10 minutos', () => {
    expect(LOCK_MS).toBe(10 * 60 * 1000);
  });
  it('no bloqueado 11 min antes', () => {
    expect(estaBloqueado(inicio, new Date('2026-06-16T17:49:00Z'))).toBe(false);
  });
  it('bloqueado justo a 10 min antes', () => {
    expect(estaBloqueado(inicio, new Date('2026-06-16T17:50:00Z'))).toBe(true);
  });
  it('rival se revela cuando esta bloqueado', () => {
    expect(rivalRevelado(inicio, new Date('2026-06-16T17:50:00Z'))).toBe(true);
    expect(rivalRevelado(inicio, new Date('2026-06-16T17:49:00Z'))).toBe(false);
  });
  it('msAlCierre cuenta hasta inicio-10min', () => {
    expect(msAlCierre(inicio, new Date('2026-06-16T17:49:00Z'))).toBe(60 * 1000);
    expect(msAlCierre(inicio, new Date('2026-06-16T17:55:00Z'))).toBe(0);
  });
});
