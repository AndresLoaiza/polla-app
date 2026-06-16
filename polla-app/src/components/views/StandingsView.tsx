import GlassCard from '../glass/GlassCard';
import { calcularTabla } from '../../lib/standings';
import { USER_COLOR, USER_NOMBRE } from '../../lib/identity';
import type { Partido, Prediccion } from '../../types';

export default function StandingsView({ partidos, predicciones }:
  { partidos: Partido[]; predicciones: Prediccion[] }) {
  const tabla = calcularTabla(partidos, predicciones);
  return (
    <div className="flex flex-col gap-3 pb-24">
      {tabla.map((f, i) => (
        <GlassCard key={f.usuario} className="p-4 flex items-center justify-between"
          style={{ boxShadow: `0 0 0 1.5px ${USER_COLOR[f.usuario]}` }}>
          <span className="flex items-center gap-3">
            <span className="text-lg opacity-60">{i + 1}</span>
            <span className="font-semibold" style={{ color: USER_COLOR[f.usuario] }}>{USER_NOMBRE[f.usuario]}</span>
          </span>
          <span className="text-right">
            <span className="text-2xl font-bold">{f.total}</span>
            <span className="block text-xs opacity-60">{f.plenos} plenos</span>
          </span>
        </GlassCard>
      ))}
    </div>
  );
}
