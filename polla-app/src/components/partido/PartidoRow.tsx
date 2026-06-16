import GlassCard from '../glass/GlassCard';
import ScoreInput from './ScoreInput';
import { msAlCierre } from '../../lib/lock';
import { nombreEs, bandera } from '../../lib/equipos';
import { USER_COLOR } from '../../lib/identity';
import type { Partido, Usuario } from '../../types';

function fmtCuenta(ms: number): string {
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60);
  if (h > 24) return `cierra en ${Math.floor(h / 24)}d`;
  if (h > 0) return `cierra en ${h}h ${m % 60}m`;
  return `cierra en ${m}m`;
}

/** Fila editable de un partido sin boton propio: el guardado es global. */
export default function PartidoRow({ partido, gl, gv, usuario, tocado, onChange }:
  { partido: Partido; gl: number; gv: number; usuario: Usuario; tocado: boolean;
    onChange: (gl: number, gv: number) => void }) {
  const color = USER_COLOR[usuario];
  return (
    <GlassCard className="p-4" style={tocado ? { boxShadow: `0 0 0 1.5px ${color}` } : undefined}>
      <div className="flex items-center justify-between text-xs opacity-70 mb-3">
        <span>{partido.grupo ? `Grupo ${partido.grupo}` : 'Eliminación'}</span>
        <span>{fmtCuenta(msAlCierre(partido.fecha_hora))}</span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <span className="flex-1 flex items-center justify-end gap-2 font-semibold text-right">
          <span className="truncate">{nombreEs(partido.equipo_local)}</span>
          <span className="text-xl shrink-0">{bandera(partido.equipo_local)}</span>
        </span>
        <ScoreInput value={gl} onChange={n => onChange(n, gv)} color={color} />
        <span className="opacity-50">:</span>
        <ScoreInput value={gv} onChange={n => onChange(gl, n)} color={color} />
        <span className="flex-1 flex items-center gap-2 font-semibold">
          <span className="text-xl shrink-0">{bandera(partido.equipo_visitante)}</span>
          <span className="truncate">{nombreEs(partido.equipo_visitante)}</span>
        </span>
      </div>
    </GlassCard>
  );
}
