import { useState } from 'react';
import { Save, ChevronDown } from 'lucide-react';
import PartidoRow from '../partido/PartidoRow';
import MatchDetail from '../partido/MatchDetail';
import { estaBloqueado } from '../../lib/lock';
import { guardarPredicciones } from '../../lib/db';
import { esHoy } from '../../lib/torneo';
import { USER_COLOR } from '../../lib/identity';
import type { Partido, Prediccion, Usuario } from '../../types';

const PAGINA = 10;

type Edit = { gl: number | null; gv: number | null };

export default function PartidosView({ partidos, predicciones, usuario, onSavedMany, excluirHoy }:
  { partidos: Partido[]; predicciones: Prediccion[]; usuario: Usuario; onSavedMany: (p: Prediccion[]) => void;
    excluirHoy?: boolean }) {
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  const [visibles, setVisibles] = useState(PAGINA);
  const [guardando, setGuardando] = useState(false);

  // Los de hoy viven en la pestaña "Hoy": en "Partidos" se excluyen (excluirHoy).
  // El resto, los finalizados van a "Jugados".
  partidos = partidos.filter(p =>
    esHoy(p.fecha_hora) ? !excluirHoy : p.estado !== 'finalizado');

  if (partidos.length === 0)
    return <p className="opacity-60 text-center py-16">No hay partidos próximos.</p>;

  function valorDe(p: Partido): Edit {
    const e = edits[p.id];
    if (e) return e;
    const pr = predicciones.find(x => x.partido_id === p.id && x.usuario === usuario);
    // sin predicción guardada => null (no 0), para no confundir "sin jugar" con "0-0".
    return pr ? { gl: pr.gol_local, gv: pr.gol_visitante } : { gl: null, gv: null };
  }

  const mostrados = partidos.slice(0, visibles);
  // solo se pueden guardar predicciones completas (ambos marcadores) y no bloqueadas.
  const pendientes = Object.keys(edits).filter(id => {
    const p = partidos.find(x => x.id === id);
    const e = edits[id];
    return p && !estaBloqueado(p.fecha_hora) && e.gl !== null && e.gv !== null;
  });

  async function guardarTodo() {
    if (pendientes.length === 0 || guardando) return;
    setGuardando(true);
    try {
      const items = pendientes.map(id => ({ partido_id: id, gol_local: edits[id].gl!, gol_visitante: edits[id].gv! }));
      onSavedMany(await guardarPredicciones(items, usuario));
      setEdits({});
    } finally { setGuardando(false); }
  }

  return (
    <div className="flex flex-col gap-4 pb-32">
      {mostrados.map(partido => {
        if (estaBloqueado(partido.fecha_hora))
          return <MatchDetail key={partido.id} partido={partido} predicciones={predicciones} usuario={usuario} />;
        const v = valorDe(partido);
        return (
          <PartidoRow key={partido.id} partido={partido} gl={v.gl} gv={v.gv} usuario={usuario}
            tocado={!!edits[partido.id]}
            onChange={(gl, gv) => setEdits(prev => ({ ...prev, [partido.id]: { gl: gl ?? 0, gv: gv ?? 0 } }))} />
        );
      })}

      {visibles < partidos.length && (
        <button onClick={() => setVisibles(v => v + PAGINA)}
          className="glass rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
          <ChevronDown className="w-4 h-4" /> Ver más ({partidos.length - visibles} restantes)
        </button>
      )}

      {pendientes.length > 0 && (
        <div className="fixed bottom-16 inset-x-0 px-4">
          <div className="max-w-lg mx-auto">
            <button onClick={guardarTodo} disabled={guardando}
              className="glass w-full rounded-xl py-3 font-bold flex items-center justify-center gap-2"
              style={{ boxShadow: `0 0 0 2px ${USER_COLOR[usuario]}` }}>
              <Save className="w-4 h-4" />
              {guardando ? 'Guardando…' : `Guardar ${pendientes.length} predicción${pendientes.length > 1 ? 'es' : ''}`}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
