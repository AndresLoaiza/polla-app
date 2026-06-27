import { Check, Clock } from 'lucide-react';
import { USER_COLOR, USER_NOMBRE } from '../../lib/identity';
import type { Prediccion, Usuario } from '../../types';

const USUARIOS: Usuario[] = ['andres', 'melisa'];

/** Indica, por jugador, si ya guardo su prediccion para este partido. Solo
 *  muestra el estado (guardo / pendiente), nunca el marcador, para no revelar
 *  la prediccion del rival antes del cierre. */
export default function EstadoGuardado({ partidoId, predicciones }:
  { partidoId: string; predicciones: Prediccion[] }) {
  return (
    <div className="flex items-center justify-center gap-4 text-xs">
      {USUARIOS.map(u => {
        const guardo = predicciones.some(p => p.partido_id === partidoId && p.usuario === u);
        return (
          <span key={u} className="flex items-center gap-1"
            style={guardo ? { color: USER_COLOR[u] } : undefined}>
            {guardo
              ? <Check className="w-3.5 h-3.5 shrink-0" />
              : <Clock className="w-3.5 h-3.5 shrink-0 opacity-40" />}
            <span className={guardo ? 'font-semibold' : 'opacity-50'}>
              {USER_NOMBRE[u]} {guardo ? 'ya guardó' : 'pendiente'}
            </span>
          </span>
        );
      })}
    </div>
  );
}
