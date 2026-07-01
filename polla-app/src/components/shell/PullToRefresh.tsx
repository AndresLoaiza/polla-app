import { useRef, useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';

const UMBRAL = 70;   // px de arrastre para disparar el refresco
const MAX = 110;     // tope visual del arrastre

/** Pull-to-refresh táctil: arrastrar hacia abajo estando arriba del todo dispara
 *  onRefresh. Muestra solo un indicador (no traslada el contenido) para no crear
 *  un containing block que rompa los elementos `fixed` (barra inferior, boton). */
export default function PullToRefresh({ onRefresh, children }:
  { onRefresh: () => Promise<void> | void; children: ReactNode }) {
  const [pull, setPull] = useState(0);
  const [refrescando, setRefrescando] = useState(false);
  const inicioY = useRef<number | null>(null);

  function onTouchStart(e: React.TouchEvent) {
    inicioY.current = (window.scrollY <= 0 && !refrescando) ? e.touches[0].clientY : null;
  }
  function onTouchMove(e: React.TouchEvent) {
    if (inicioY.current === null) return;
    const dy = e.touches[0].clientY - inicioY.current;
    setPull(dy > 0 ? Math.min(MAX, dy * 0.5) : 0);   // resistencia
  }
  async function onTouchEnd() {
    if (inicioY.current === null) return;
    inicioY.current = null;
    if (pull >= UMBRAL && !refrescando) {
      setRefrescando(true);
      try { await onRefresh(); } finally { setRefrescando(false); }
    }
    setPull(0);
  }

  const arrastrando = inicioY.current !== null;
  const y = refrescando ? UMBRAL : pull;
  return (
    <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
      <div className="fixed inset-x-0 top-0 z-40 flex justify-center pointer-events-none"
        style={{
          transform: `translateY(${y}px)`,
          opacity: y > 4 ? 1 : 0,
          transition: arrastrando ? 'none' : 'transform .25s ease, opacity .25s ease',
        }}>
        <div className="glass rounded-full w-9 h-9 flex items-center justify-center mt-1 shadow-lg">
          <RefreshCw className={`w-5 h-5 ${refrescando ? 'animate-spin' : ''}`}
            style={refrescando ? undefined : { transform: `rotate(${pull * 2.5}deg)`, opacity: Math.min(1, pull / UMBRAL) }} />
        </div>
      </div>
      {children}
    </div>
  );
}
