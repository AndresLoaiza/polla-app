import GlassCard from '../glass/GlassCard';
import { rivalRevelado } from '../../lib/lock';
import { puntuar } from '../../lib/scoring';
import { nombreEs, bandera } from '../../lib/equipos';
import { USER_COLOR, USER_NOMBRE } from '../../lib/identity';
import type { Partido, Prediccion, Usuario } from '../../types';

const OTRO: Record<Usuario, Usuario> = { andres: 'melisa', melisa: 'andres' };

function FilaDesglose({ p, partido, usuario }:
  { p?: Prediccion; partido: Partido; usuario: Usuario }) {
  const color = USER_COLOR[usuario];
  if (!p) return <p className="opacity-50 text-sm py-1">{USER_NOMBRE[usuario]} no predijo</p>;
  const finalizado = partido.gol_local_real !== null && partido.gol_visitante_real !== null;
  const d = finalizado
    ? puntuar(p.gol_local, p.gol_visitante, partido.gol_local_real!, partido.gol_visitante_real!, partido.fase)
    : null;
  return (
    <div className="flex items-center justify-between py-1">
      <span style={{ color }} className="font-semibold">{USER_NOMBRE[usuario]}</span>
      <span className="tabular-nums">{p.gol_local} : {p.gol_visitante}</span>
      {d && (
        <span className="text-sm opacity-80">
          {d.total} pts ({d.resultado}+{d.golLocal}+{d.golVisitante}+{d.diferencia})
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
          : <>
              <div className="opacity-60 text-sm mt-1">{new Date(partido.fecha_hora).toLocaleString('es-CO')}</div>
              <div className="opacity-40 text-xs mt-0.5">Edición cerrada</div>
            </>}
      </div>
      <FilaDesglose p={mia} partido={partido} usuario={usuario} />
      {revelado
        ? <FilaDesglose p={delOtro} partido={partido} usuario={OTRO[usuario]} />
        : <p className="opacity-50 text-sm py-1">Predicción de {USER_NOMBRE[OTRO[usuario]]} oculta hasta el cierre</p>}
    </GlassCard>
  );
}
