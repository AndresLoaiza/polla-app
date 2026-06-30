import GlassCard from '../glass/GlassCard';
import EstadoGuardado from './EstadoGuardado';
import { rivalRevelado } from '../../lib/lock';
import { puntuar } from '../../lib/scoring';
import { nombreEs, bandera } from '../../lib/equipos';
import { USER_COLOR, USER_NOMBRE } from '../../lib/identity';
import type { Partido, Prediccion, Usuario } from '../../types';

const OTRO: Record<Usuario, Usuario> = { andres: 'melisa', melisa: 'andres' };

function FilaDesglose({ p, partido, usuario }:
  { p?: Prediccion; partido: Partido; usuario: Usuario }) {
  const color = USER_COLOR[usuario];
  const finalizado = partido.gol_local_real !== null && partido.gol_visitante_real !== null;
  const d = p && finalizado
    ? puntuar(p.gol_local, p.gol_visitante, partido.gol_local_real!, partido.gol_visitante_real!, partido.fase)
    : null;
  return (
    <div className="grid grid-cols-[5rem_4.5rem_1fr] items-center py-1 gap-1">
      <span style={{ color }} className="font-semibold">{USER_NOMBRE[usuario]}</span>
      <span className="tabular-nums text-center">
        {p ? `${p.gol_local} : ${p.gol_visitante}` : <span className="opacity-40 text-sm">—</span>}
      </span>
      {d && (
        <span className="text-xs opacity-80 text-right">
          {d.total}pts ({d.resultado}+{d.golLocal}+{d.golVisitante}+{d.diferencia})
        </span>
      )}
    </div>
  );
}

export default function MatchDetail({ partido, predicciones, usuario }:
  { partido: Partido; predicciones: Prediccion[]; usuario: Usuario }) {
  const mia = predicciones.find(p => p.partido_id === partido.id && p.usuario === usuario);
  const delOtro = predicciones.find(p => p.partido_id === partido.id && p.usuario === OTRO[usuario]);
  const revelado = rivalRevelado(partido.fecha_hora);
  const finalizado = partido.estado === 'finalizado';
  const enJuego = partido.estado === 'en_juego';

  return (
    <GlassCard className="p-4">
      <div className="text-center mb-3">
        <div className="font-semibold flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
          <span className="whitespace-nowrap">{bandera(partido.equipo_local)} {nombreEs(partido.equipo_local)}</span>
          <span className="opacity-50">vs</span>
          <span className="whitespace-nowrap">{nombreEs(partido.equipo_visitante)} {bandera(partido.equipo_visitante)}</span>
        </div>
        {finalizado
          ? <div className="text-2xl font-bold tabular-nums mt-1">{partido.gol_local_real} : {partido.gol_visitante_real}</div>
          : enJuego
            ? <>
                <div className="text-2xl font-bold tabular-nums mt-1">{partido.gol_local_real ?? 0} : {partido.gol_visitante_real ?? 0}</div>
                <div className="mt-0.5 inline-flex items-center gap-1.5 text-xs font-bold text-red-100">
                  <span className="relative flex h-2 w-2" aria-hidden>
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                  </span>
                  EN VIVO · parcial
                </div>
              </>
            : <>
                <div className="opacity-60 text-sm mt-1">{new Date(partido.fecha_hora).toLocaleString('es-CO')}</div>
                <div className="opacity-40 text-xs mt-0.5">Edición cerrada</div>
              </>}
      </div>
      <div className="mb-2 pb-2 border-b border-white/10">
        <EstadoGuardado partidoId={partido.id} predicciones={predicciones} />
      </div>
      <FilaDesglose p={mia} partido={partido} usuario={usuario} />
      {revelado
        ? <FilaDesglose p={delOtro} partido={partido} usuario={OTRO[usuario]} />
        : <p className="opacity-50 text-sm py-1">Predicción de {USER_NOMBRE[OTRO[usuario]]} oculta hasta el cierre</p>}
    </GlassCard>
  );
}
