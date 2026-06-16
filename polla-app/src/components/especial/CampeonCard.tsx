import { useState } from 'react';
import { Trophy, Check, X } from 'lucide-react';
import GlassCard from '../glass/GlassCard';
import { estaBloqueado, rivalRevelado } from '../../lib/lock';
import { equiposDelTorneo, inicioEliminacion } from '../../lib/torneo';
import { nombreEs, bandera } from '../../lib/equipos';
import { guardarCampeon } from '../../lib/db';
import { USER_COLOR, USER_NOMBRE } from '../../lib/identity';
import { PUNTOS_CAMPEON } from '../../types';
import type { Partido, Especial, Usuario } from '../../types';

const OTRO: Record<Usuario, Usuario> = { andres: 'melisa', melisa: 'andres' };

export default function CampeonCard({ partidos, especiales, campeonReal, usuario, onSaved }:
  { partidos: Partido[]; especiales: Especial[]; campeonReal: string | null;
    usuario: Usuario; onSaved: (e: Especial) => void }) {
  const inicio = inicioEliminacion(partidos);
  const cerrado = inicio ? estaBloqueado(inicio) : false;
  const revelado = inicio ? rivalRevelado(inicio) : false;

  const mio = especiales.find(e => e.usuario === usuario && e.tipo === 'campeon')?.valor ?? '';
  const rival = especiales.find(e => e.usuario === OTRO[usuario] && e.tipo === 'campeon')?.valor;

  const [valor, setValor] = useState(mio);
  const [guardando, setGuardando] = useState(false);
  const equipos = equiposDelTorneo(partidos);

  async function guardar() {
    if (!valor || cerrado || guardando) return;
    setGuardando(true);
    try { onSaved(await guardarCampeon(usuario, valor)); }
    finally { setGuardando(false); }
  }

  const acerto = campeonReal && mio === campeonReal;

  return (
    <GlassCard className="p-4" style={{ boxShadow: `0 0 0 1.5px #eab308` }}>
      <div className="flex items-center gap-2 font-bold mb-3">
        <Trophy className="w-5 h-5" style={{ color: '#eab308' }} />
        Campeón del Mundial
        <span className="ml-auto text-xs font-semibold opacity-70">{PUNTOS_CAMPEON} pts</span>
      </div>

      {campeonReal && (
        <div className="text-sm mb-3 flex items-center gap-2">
          <span className="opacity-70">Resultado:</span>
          <span className="font-semibold">{bandera(campeonReal)} {nombreEs(campeonReal)}</span>
        </div>
      )}

      {!cerrado ? (
        <div className="flex flex-col gap-3">
          <select value={valor} onChange={e => setValor(e.target.value)}
            className="w-full rounded-xl bg-white/10 border border-white/20 px-3 py-2.5 outline-none">
            <option value="" disabled>Elige tu campeón…</option>
            {equipos.map(n => <option key={n} value={n} className="bg-[#0c1a12]">{nombreEs(n)}</option>)}
          </select>
          <button onClick={guardar} disabled={!valor || guardando}
            className="glass rounded-xl py-2 font-semibold disabled:opacity-40"
            style={{ boxShadow: `0 0 0 1.5px ${USER_COLOR[usuario]}` }}>
            {guardando ? 'Guardando…' : mio ? 'Cambiar campeón' : 'Guardar campeón'}
          </button>
          <p className="text-xs opacity-50">Cierra al empezar la fase de eliminación.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1 text-sm">
          <Pick usuario={usuario} valor={mio} real={campeonReal} />
          {revelado
            ? <Pick usuario={OTRO[usuario]} valor={rival} real={campeonReal} />
            : <p className="opacity-50">Campeón de {USER_NOMBRE[OTRO[usuario]]} oculto hasta el cierre</p>}
        </div>
      )}

      {campeonReal && cerrado && (
        <p className="text-sm font-semibold mt-2" style={{ color: acerto ? '#22c55e' : undefined }}>
          {acerto ? `¡Acertaste! +${PUNTOS_CAMPEON} pts` : 'No acertaste el campeón'}
        </p>
      )}
    </GlassCard>
  );
}

function Pick({ usuario, valor, real }: { usuario: Usuario; valor?: string; real: string | null }) {
  const color = USER_COLOR[usuario];
  if (!valor) return <p className="opacity-50">{USER_NOMBRE[usuario]} no eligió</p>;
  const ok = real && valor === real;
  return (
    <div className="flex items-center justify-between">
      <span className="font-semibold" style={{ color }}>{USER_NOMBRE[usuario]}</span>
      <span className="flex items-center gap-1.5">
        {bandera(valor)} {nombreEs(valor)}
        {real && (ok ? <Check className="w-4 h-4 text-green-400" /> : <X className="w-4 h-4 opacity-50" />)}
      </span>
    </div>
  );
}
