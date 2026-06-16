import { motion } from 'framer-motion';
import { X } from 'lucide-react';

const FILAS: [string, string, string][] = [
  ['Acertar el resultado (ganador o empate)', '5', '10'],
  ['Goles exactos del equipo local', '2', '4'],
  ['Goles exactos del equipo visitante', '2', '4'],
  ['Acertar la diferencia de goles', '1', '2'],
];

export default function ScoringInfo({ onClose }: { onClose: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div className="glass relative w-full max-w-lg rounded-t-3xl p-6 pb-10"
        initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}>
        <button aria-label="cerrar" onClick={onClose} className="absolute right-4 top-4 opacity-60 hover:opacity-100">
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-bold text-lg flex items-center gap-2">⚽ ¿Cómo se puntúa?</h2>
        <p className="text-sm opacity-70 mt-1 mb-5">Predices el marcador exacto. Sumas por cada acierto:</p>

        <div className="grid grid-cols-[1fr_3rem_3rem] gap-x-3 gap-y-2.5 text-sm items-center">
          <span></span>
          <span className="font-bold text-center" style={{ color: 'var(--color-pitch)' }}>Grupos</span>
          <span className="font-bold text-center" style={{ color: '#eab308' }}>Elim.</span>
          {FILAS.map(([label, g, e]) => (
            <FilaInfo key={label} label={label} g={g} e={e} />
          ))}
          <span className="font-bold pt-3 mt-1 border-t border-white/15">Máximo posible</span>
          <span className="font-bold text-center pt-3 mt-1 border-t border-white/15">10</span>
          <span className="font-bold text-center pt-3 mt-1 border-t border-white/15">20</span>
        </div>

        <p className="text-xs opacity-60 mt-5">
          Puedes editar tu predicción hasta <strong>10 minutos</strong> antes del inicio.
          La predicción del rival se revela en ese momento.
        </p>
      </motion.div>
    </motion.div>
  );
}

function FilaInfo({ label, g, e }: { label: string; g: string; e: string }) {
  return (
    <>
      <span className="opacity-90">{label}</span>
      <span className="text-center tabular-nums">{g}</span>
      <span className="text-center tabular-nums">{e}</span>
    </>
  );
}
