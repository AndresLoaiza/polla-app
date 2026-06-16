import type { Partido } from '../types';
import { nombreEs } from './equipos';

/** Equipos reales del torneo (sin "Por definir"), ordenados por nombre en español. */
export function equiposDelTorneo(partidos: Partido[]): string[] {
  const set = new Set<string>();
  for (const p of partidos) {
    if (p.equipo_local !== 'Por definir') set.add(p.equipo_local);
    if (p.equipo_visitante !== 'Por definir') set.add(p.equipo_visitante);
  }
  return [...set].sort((a, b) => nombreEs(a).localeCompare(nombreEs(b), 'es'));
}

/** Inicio de la fase de eliminación (primer partido), o null si aún no hay. */
export function inicioEliminacion(partidos: Partido[]): string | null {
  const elim = partidos.filter(p => p.fase === 'eliminacion').map(p => p.fecha_hora).sort();
  return elim[0] ?? null;
}
