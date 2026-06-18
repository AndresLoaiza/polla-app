import PartidosView from './PartidosView';
import { esHoy } from '../../lib/torneo';
import type { Partido, Prediccion, Usuario } from '../../types';

export default function TodayView(props:
  { partidos: Partido[]; predicciones: Prediccion[]; usuario: Usuario; onSavedMany: (p: Prediccion[]) => void }) {
  const hoy = props.partidos.filter(p => esHoy(p.fecha_hora));
  if (hoy.length === 0)
    return <p className="opacity-60 text-center py-16">No hay partidos hoy. Revisa Partidos.</p>;
  return <PartidosView {...props} partidos={hoy} />;
}
