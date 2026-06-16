import { useState } from 'react';
import { Lock } from 'lucide-react';
import GlassCard from '../glass/GlassCard';
import ScoreInput from './ScoreInput';
import { estaBloqueado, msAlCierre } from '../../lib/lock';
import { USER_COLOR } from '../../lib/identity';
import { guardarPrediccion } from '../../lib/db';
import type { Partido, Prediccion, Usuario } from '../../types';

function fmtCuenta(ms: number): string {
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60);
  if (h > 24) return `cierra en ${Math.floor(h / 24)}d`;
  if (h > 0) return `cierra en ${h}h ${m % 60}m`;
  return `cierra en ${m}m`;
}

export default function PredictionCard({ partido, miPrediccion, usuario, onSaved }:
  { partido: Partido; miPrediccion?: Prediccion; usuario: Usuario; onSaved: (p: Prediccion) => void }) {
  const [gl, setGl] = useState(miPrediccion?.gol_local ?? 0);
  const [gv, setGv] = useState(miPrediccion?.gol_visitante ?? 0);
  const [guardando, setGuardando] = useState(false);
  const bloqueado = estaBloqueado(partido.fecha_hora);
  const color = USER_COLOR[usuario];

  async function guardar() {
    if (bloqueado || guardando) return;
    setGuardando(true);
    try { onSaved(await guardarPrediccion(partido.id, usuario, gl, gv)); }
    finally { setGuardando(false); }
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between text-sm opacity-70 mb-3">
        <span>{partido.grupo ? `Grupo ${partido.grupo}` : 'Eliminación'}</span>
        <span className="flex items-center gap-1">
          {bloqueado ? <><Lock className="w-3 h-3" /> cerrado</> : fmtCuenta(msAlCierre(partido.fecha_hora))}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="flex-1 text-right font-semibold">{partido.equipo_local}</span>
        <ScoreInput value={gl} onChange={setGl} disabled={bloqueado} color={color} />
        <span className="opacity-50">:</span>
        <ScoreInput value={gv} onChange={setGv} disabled={bloqueado} color={color} />
        <span className="flex-1 font-semibold">{partido.equipo_visitante}</span>
      </div>
      {!bloqueado && (
        <button onClick={guardar} disabled={guardando}
          className="glass mt-4 w-full rounded-xl py-2 font-semibold"
          style={{ boxShadow: `0 0 0 1.5px ${color}` }}>
          {guardando ? 'Guardando…' : miPrediccion ? 'Actualizar' : 'Guardar predicción'}
        </button>
      )}
    </GlassCard>
  );
}
