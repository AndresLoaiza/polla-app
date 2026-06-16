import { useState } from 'react';
import { Save, ChevronDown } from 'lucide-react';
import PartidoRow from '../partido/PartidoRow';
import MatchDetail from '../partido/MatchDetail';
import { estaBloqueado } from '../../lib/lock';
import { guardarPredicciones } from '../../lib/db';
import { USER_COLOR } from '../../lib/identity';
import type { Partido, Prediccion, Usuario } from '../../types';

const PAGINA = 10;

export default function PartidosView({ partidos, predicciones, usuario, onSavedMany }:
  { partidos: Partido[]; predicciones: Prediccion[]; usuario: Usuario; onSavedMany: (p: Prediccion[]) => void }) {
  const [edits, setEdits] = useState<Record<string, { gl: number; gv: number }>>({});
  const [visibles, setVisibles] = useState(PAGINA);
  const [guardando, setGuardando] = useState(false);

  if (partidos.length === 0)
    return <p className="opacity-60 text-center py-16">No hay partidos cargados todavía.</p>;

  function valorDe(p: Partido) {
    const e = edits[p.id];
    if (e) return e;
    const pr = predicciones.find(x => x.partido_id === p.id && x.usuario === usuario);
    return { gl: pr?.gol_local ?? 0, gv: pr?.gol_visitante ?? 0 };
  }

  const mostrados = partidos.slice(0, visibles);
  const pendientes = Object.keys(edits).filter(id => {
    const p = partidos.find(x => x.id === id);
    return p && !estaBloqueado(p.fecha_hora);
  });

  async function guardarTodo() {
    if (pendientes.length === 0 || guardando) return;
    setGuardando(true);
    try {
      const items = pendientes.map(id => ({ partido_id: id, gol_local: edits[id].gl, gol_visitante: edits[id].gv }));
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
            onChange={(gl, gv) => setEdits(prev => ({ ...prev, [partido.id]: { gl, gv } }))} />
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
