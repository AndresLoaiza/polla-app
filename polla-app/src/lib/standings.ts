import type { Partido, Prediccion, Usuario } from '../types';
import { puntuar } from './scoring';

export interface FilaTabla {
  usuario: Usuario;
  total: number;
  plenos: number;   // partidos con puntaje maximo (10 grupos / 20 elim)
  p7: number;
  p6: number;
  p5: number;
}

const USUARIOS: Usuario[] = ['andres', 'melisa'];

export function calcularTabla(partidos: Partido[], predicciones: Prediccion[]): FilaTabla[] {
  const finalizados = partidos.filter(
    p => p.estado === 'finalizado' && p.gol_local_real !== null && p.gol_visitante_real !== null,
  );
  const filas: FilaTabla[] = USUARIOS.map(usuario => {
    let total = 0, plenos = 0, p7 = 0, p6 = 0, p5 = 0;
    for (const partido of finalizados) {
      const pr = predicciones.find(x => x.partido_id === partido.id && x.usuario === usuario);
      if (!pr) continue;
      const d = puntuar(pr.gol_local, pr.gol_visitante, partido.gol_local_real!, partido.gol_visitante_real!, partido.fase);
      total += d.total;
      const max = partido.fase === 'eliminacion' ? 20 : 10;
      if (d.total === max) plenos++;
      else if (d.total === 7) p7++;
      else if (d.total === 6) p6++;
      else if (d.total === 5) p5++;
    }
    return { usuario, total, plenos, p7, p6, p5 };
  });
  return filas.sort((a, b) =>
    b.total - a.total || b.plenos - a.plenos || b.p7 - a.p7 || b.p6 - a.p6 || b.p5 - a.p5,
  );
}
