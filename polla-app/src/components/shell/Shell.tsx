import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarDays, Flag, History, Trophy, HelpCircle, Bell, BellRing, RefreshCw } from 'lucide-react';
import { activarRecordatorios, estaSuscrito, type EstadoPush } from '../../lib/push';
import TodayView from '../views/TodayView';
import PartidosView from '../views/PartidosView';
import JugadosView from '../views/JugadosView';
import StandingsView from '../views/StandingsView';
import ScoringInfo from '../info/ScoringInfo';
import { USER_COLOR, USER_NOMBRE } from '../../lib/identity';
import type { Partido, Prediccion, Especial, Usuario } from '../../types';

type Tab = 'hoy' | 'partidos' | 'jugados' | 'tabla';

export default function Shell({ usuario, partidos, predicciones, especiales, campeonReal, onSavedMany, onSavedEspecial, onRefresh, refrescando }:
  { usuario: Usuario; partidos: Partido[]; predicciones: Prediccion[]; especiales: Especial[];
    campeonReal: string | null; onSavedMany: (p: Prediccion[]) => void; onSavedEspecial: (e: Especial) => void;
    onRefresh: () => void; refrescando: boolean }) {
  const [tab, setTab] = useState<Tab>('hoy');
  const [info, setInfo] = useState(false);
  const [suscrito, setSuscrito] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => { estaSuscrito().then(setSuscrito); }, []);

  async function toggleRecordatorios() {
    const r = await activarRecordatorios(usuario);
    const msg: Record<EstadoPush, string> = {
      ok: '🔔 Recordatorios activados',
      denegado: 'Permiso de notificaciones denegado',
      'no-soportado': 'Tu navegador no soporta notificaciones (en iPhone instala la app primero)',
      'sin-clave': 'Falta configurar VAPID',
      error: 'No se pudo activar',
    };
    if (r === 'ok') setSuscrito(true);
    setToast(msg[r]);
    setTimeout(() => setToast(null), 4000);
  }
  const tabs: { id: Tab; label: string; icon: typeof Trophy }[] = [
    { id: 'hoy', label: 'Hoy', icon: CalendarDays },
    { id: 'partidos', label: 'Partidos', icon: Flag },
    { id: 'jugados', label: 'Jugados', icon: History },
    { id: 'tabla', label: 'Tabla', icon: Trophy },
  ];

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <header className="mb-5">
        <div className="flex items-center justify-between gap-2">
          <h1 className="font-bold text-xl flex items-center gap-2">
            <span className="text-2xl">⚽</span> Polla Mundial 2026
          </h1>
          <div className="flex items-center gap-2">
            <button aria-label="actualizar" onClick={onRefresh} disabled={refrescando}
              className="glass w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-60">
              <RefreshCw className={`w-5 h-5 ${refrescando ? 'animate-spin' : ''}`} />
            </button>
            <button aria-label="recordatorios" onClick={toggleRecordatorios}
              className="glass w-9 h-9 rounded-full flex items-center justify-center"
              style={suscrito ? { color: 'var(--color-pitch)' } : undefined}>
              {suscrito ? <BellRing className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
            </button>
            <button aria-label="cómo se puntúa" onClick={() => setInfo(true)}
              className="glass w-9 h-9 rounded-full flex items-center justify-center">
              <HelpCircle className="w-5 h-5" />
            </button>
            <span className="text-sm font-bold px-3 py-1.5 rounded-full glass"
              style={{ color: USER_COLOR[usuario], boxShadow: `0 0 0 1.5px ${USER_COLOR[usuario]}` }}>
              {USER_NOMBRE[usuario]}
            </span>
          </div>
        </div>
        <div className="mt-2 h-1 rounded-full pitch-stripe" />
      </header>

      {tab === 'hoy' && <TodayView usuario={usuario} partidos={partidos} predicciones={predicciones} onSavedMany={onSavedMany} />}
      {tab === 'partidos' && <PartidosView usuario={usuario} partidos={partidos} predicciones={predicciones} onSavedMany={onSavedMany} excluirHoy />}
      {tab === 'jugados' && <JugadosView usuario={usuario} partidos={partidos} predicciones={predicciones} />}
      {tab === 'tabla' && <StandingsView partidos={partidos} predicciones={predicciones}
        especiales={especiales} campeonReal={campeonReal} usuario={usuario} onSavedEspecial={onSavedEspecial} />}

      <nav className="fixed bottom-0 inset-x-0 glass border-t border-white/10 flex justify-around pt-3"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex flex-col items-center gap-1 px-4 py-1 transition-opacity"
            style={{ opacity: tab === t.id ? 1 : 0.5, color: tab === t.id ? 'var(--color-pitch)' : undefined }}>
            <t.icon className="w-6 h-6" /><span className="text-xs font-medium">{t.label}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {info && <ScoringInfo onClose={() => setInfo(false)} />}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
            <div className="glass rounded-full px-4 py-2 text-sm font-medium text-center">{toast}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
