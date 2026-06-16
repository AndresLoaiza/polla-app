import { useState } from 'react';
import { CalendarDays, ListChecks, Trophy } from 'lucide-react';
import TodayView from '../views/TodayView';
import FixturesView from '../views/FixturesView';
import StandingsView from '../views/StandingsView';
import { USER_COLOR, USER_NOMBRE } from '../../lib/identity';
import type { Partido, Prediccion, Usuario } from '../../types';

type Tab = 'hoy' | 'fixtures' | 'tabla';

export default function Shell({ usuario, partidos, predicciones, onSaved }:
  { usuario: Usuario; partidos: Partido[]; predicciones: Prediccion[]; onSaved: (p: Prediccion) => void }) {
  const [tab, setTab] = useState<Tab>('hoy');
  const tabs: { id: Tab; label: string; icon: typeof Trophy }[] = [
    { id: 'hoy', label: 'Hoy', icon: CalendarDays },
    { id: 'fixtures', label: 'Fixtures', icon: ListChecks },
    { id: 'tabla', label: 'Tabla', icon: Trophy },
  ];
  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <header className="flex items-center justify-between mb-5">
        <h1 className="font-bold text-xl">Polla Mundial 2026</h1>
        <span className="text-sm font-semibold" style={{ color: USER_COLOR[usuario] }}>{USER_NOMBRE[usuario]}</span>
      </header>
      {tab === 'hoy' && <TodayView usuario={usuario} partidos={partidos} predicciones={predicciones} onSaved={onSaved} />}
      {tab === 'fixtures' && <FixturesView usuario={usuario} partidos={partidos} predicciones={predicciones} onSaved={onSaved} />}
      {tab === 'tabla' && <StandingsView partidos={partidos} predicciones={predicciones} />}

      <nav className="fixed bottom-0 inset-x-0 glass border-t border-white/10 flex justify-around py-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 ${tab === t.id ? 'opacity-100' : 'opacity-50'}`}>
            <t.icon className="w-5 h-5" /><span className="text-xs">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
