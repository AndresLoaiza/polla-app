import PredictionCard from '../partido/PredictionCard';
import MatchDetail from '../partido/MatchDetail';
import { estaBloqueado } from '../../lib/lock';
import type { Partido, Prediccion, Usuario } from '../../types';

export default function FixturesView({ partidos, predicciones, usuario, onSaved }:
  { partidos: Partido[]; predicciones: Prediccion[]; usuario: Usuario; onSaved: (p: Prediccion) => void }) {
  if (partidos.length === 0)
    return <p className="opacity-60 text-center py-16">No hay partidos cargados todavía.</p>;
  return (
    <div className="flex flex-col gap-4 pb-24">
      {partidos.map(partido => {
        const mia = predicciones.find(p => p.partido_id === partido.id && p.usuario === usuario);
        return estaBloqueado(partido.fecha_hora)
          ? <MatchDetail key={partido.id} partido={partido} predicciones={predicciones} usuario={usuario} />
          : <PredictionCard key={partido.id} partido={partido} miPrediccion={mia} usuario={usuario} onSaved={onSaved} />;
      })}
    </div>
  );
}
