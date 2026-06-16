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

/** Fila editable. Cada equipo es una columna: bandera + nombre centrados
 *  directamente encima de su propio marcador. */
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

      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <ColumnaEquipo nombre={partido.equipo_local} value={gl} color={color}
          onChange={n => onChange(n, gv)} />
        <span className="pb-1.5 text-lg opacity-40">:</span>
        <ColumnaEquipo nombre={partido.equipo_visitante} value={gv} color={color}
          onChange={n => onChange(gl, n)} />
      </div>
    </GlassCard>
  );
}

function ColumnaEquipo({ nombre, value, color, onChange }:
  { nombre: string; value: number; color: string; onChange: (n: number) => void }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col items-center justify-end gap-1 min-h-[3.4rem]">
        <span className="text-2xl leading-none">{bandera(nombre)}</span>
        <span className="text-sm font-semibold text-center leading-tight">{nombreEs(nombre)}</span>
      </div>
      <ScoreInput value={value} onChange={onChange} color={color} />
    </div>
  );
}
