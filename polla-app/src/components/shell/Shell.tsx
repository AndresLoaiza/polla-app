import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CalendarDays, Flag, History, Trophy, HelpCircle } from 'lucide-react';
import TodayView from '../views/TodayView';
import PartidosView from '../views/PartidosView';
import JugadosView from '../views/JugadosView';
import StandingsView from '../views/StandingsView';
import ScoringInfo from '../info/ScoringInfo';
import { USER_COLOR, USER_NOMBRE } from '../../lib/identity';
import type { Partido, Prediccion, Usuario } from '../../types';

type Tab = 'hoy' | 'partidos' | 'jugados' | 'tabla';

export default function Shell({ usuario, partidos, predicciones, onSavedMany }:
  { usuario: Usuario; partidos: Partido[]; predicciones: Prediccion[]; onSavedMany: (p: Prediccion[]) => void }) {
  const [tab, setTab] = useState<Tab>('hoy');
  const [info, setInfo] = useState(false);
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
      {tab === 'partidos' && <PartidosView usuario={usuario} partidos={partidos} predicciones={predicciones} onSavedMany={onSavedMany} />}
      {tab === 'jugados' && <JugadosView usuario={usuario} partidos={partidos} predicciones={predicciones} />}
      {tab === 'tabla' && <StandingsView partidos={partidos} predicciones={predicciones} />}

      <nav className="fixed bottom-0 inset-x-0 glass border-t border-white/10 flex justify-around py-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-1 transition-opacity"
            style={{ opacity: tab === t.id ? 1 : 0.5, color: tab === t.id ? 'var(--color-pitch)' : undefined }}>
            <t.icon className="w-5 h-5" /><span className="text-xs">{t.label}</span>
          </button>
        ))}
      </nav>

      <AnimatePresence>
        {info && <ScoringInfo onClose={() => setInfo(false)} />}
      </AnimatePresence>
    </div>
  );
}
