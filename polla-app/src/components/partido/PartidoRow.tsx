import GlassCard from '../glass/GlassCard';
import ScoreInput from './ScoreInput';
import { nombreEs, bandera } from '../../lib/equipos';
import { USER_COLOR } from '../../lib/identity';
import type { Partido, Usuario } from '../../types';

/** Fecha y hora del partido en la zona horaria local del dispositivo. */
function fmtHora(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit',
  });
}

/** Fila editable. Cada equipo es una columna: bandera + nombre centrados
 *  directamente encima de su propio marcador. */
export default function PartidoRow({ partido, gl, gv, usuario, tocado, onChange }:
  { partido: Partido; gl: number | null; gv: number | null; usuario: Usuario; tocado: boolean;
    onChange: (gl: number | null, gv: number | null) => void }) {
  const color = USER_COLOR[usuario];
  return (
    <GlassCard className="p-4" style={tocado ? { boxShadow: `0 0 0 1.5px ${color}` } : undefined}>
      <div className="flex items-center justify-between text-xs opacity-70 mb-3">
        <span>{partido.grupo ? `Grupo ${partido.grupo}` : 'Eliminación'}</span>
        <span>{fmtHora(partido.fecha_hora)}</span>
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
  { nombre: string; value: number | null; color: string; onChange: (n: number) => void }) {
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
