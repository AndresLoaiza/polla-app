import { describe, it, expect } from 'vitest';
import { calcularTabla } from './standings';
import type { Partido, Prediccion, Especial } from '../types';

const base = {
  ext_id: 'x', grupo: null, fecha_hora: '2026-06-16T18:00:00Z',
  equipo_local: 'A', equipo_visitante: 'B', bandera_local: null, bandera_visitante: null,
  estado: 'finalizado' as const,
};
const p = (id: string, gl: number, gv: number, fase: 'grupos' | 'eliminacion' = 'grupos'): Partido =>
  ({ ...base, id, fase, gol_local_real: gl, gol_visitante_real: gv });
const pred = (partido_id: string, usuario: 'andres' | 'melisa', gl: number, gv: number): Prediccion =>
  ({ id: partido_id + usuario, partido_id, usuario, gol_local: gl, gol_visitante: gv, updated_at: '' });

describe('calcularTabla', () => {
  it('suma puntos por usuario y ordena desc', () => {
    const partidos = [p('1', 1, 0)];
    // andres pred 1:0 = pleno 10 ; melisa pred 3:1 = solo resultado 5
    const preds = [pred('1', 'andres', 1, 0), pred('1', 'melisa', 3, 1)];
    const tabla = calcularTabla(partidos, preds);
    expect(tabla[0].usuario).toBe('andres');
    expect(tabla[0].total).toBe(10);
    expect(tabla[1].usuario).toBe('melisa');
    expect(tabla[1].total).toBe(5);
  });

  it('ignora partidos no finalizados', () => {
    const partidos = [{ ...p('1', 1, 0), estado: 'programado' as const }];
    const preds = [pred('1', 'andres', 1, 0)];
    expect(calcularTabla(partidos, preds)[0].total).toBe(0);
  });

  it('desempata por numero de plenos a igualdad de total', () => {
    // andres: un pleno (10). melisa: dos parciales de 5 (=10) sin plenos.
    const partidos = [p('1', 1, 0), p('2', 2, 0)];
    const preds = [
      pred('1', 'andres', 1, 0),   // pleno 10
      pred('1', 'melisa', 3, 1),   // 5
      pred('2', 'melisa', 4, 1),   // 5
    ];
    const tabla = calcularTabla(partidos, preds);
    expect(tabla[0].total).toBe(10);
    expect(tabla[1].total).toBe(10);
    expect(tabla[0].usuario).toBe('andres');   // gana por mas plenos
    expect(tabla[0].plenos).toBe(1);
    expect(tabla[1].plenos).toBe(0);
  });

  it('suma +20 al que acertó el campeón', () => {
    const partidos = [p('1', 1, 0)];
    const preds = [pred('1', 'andres', 1, 0)];   // andres 10 de partidos
    const esp: Especial[] = [{ id: 'e1', usuario: 'melisa', tipo: 'campeon', valor: 'Brazil', updated_at: '' }];
    const tabla = calcularTabla(partidos, preds, esp, 'Brazil');
    const melisa = tabla.find(r => r.usuario === 'melisa')!;
    expect(melisa.bonus).toBe(20);
    expect(melisa.total).toBe(20);   // 0 de partidos + 20 campeón
    const andres = tabla.find(r => r.usuario === 'andres')!;
    expect(andres.bonus).toBe(0);
    expect(andres.total).toBe(10);
    expect(tabla[0].usuario).toBe('melisa');  // 20 > 10
  });
});
