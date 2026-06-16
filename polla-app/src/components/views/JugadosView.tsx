import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import MatchDetail from '../partido/MatchDetail';
import type { Partido, Prediccion, Usuario } from '../../types';

const PAGINA = 10;

export default function JugadosView({ partidos, predicciones, usuario }:
  { partidos: Partido[]; predicciones: Prediccion[]; usuario: Usuario }) {
  const [visibles, setVisibles] = useState(PAGINA);
  // mas recientes primero
  const jugados = partidos.filter(p => p.estado === 'finalizado').slice().reverse();

  if (jugados.length === 0)
    return <p className="opacity-60 text-center py-16">Aún no hay partidos jugados.</p>;

  return (
    <div className="flex flex-col gap-4 pb-24">
      {jugados.slice(0, visibles).map(p => (
        <MatchDetail key={p.id} partido={p} predicciones={predicciones} usuario={usuario} />
      ))}
      {visibles < jugados.length && (
        <button onClick={() => setVisibles(v => v + PAGINA)}
          className="glass rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
          <ChevronDown className="w-4 h-4" /> Ver más ({jugados.length - visibles} restantes)
        </button>
      )}
    </div>
  );
}
