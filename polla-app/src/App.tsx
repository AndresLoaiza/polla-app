import { useEffect, useState } from 'react';
import AccessGate from './components/gate/AccessGate';
import Shell from './components/shell/Shell';
import BackgroundFx from './components/fx/BackgroundFx';
import { getStoredUsuario } from './lib/identity';
import { fetchPartidos, fetchPredicciones, fetchEspeciales, fetchCampeonReal } from './lib/db';
import type { Partido, Prediccion, Especial, Usuario } from './types';

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(getStoredUsuario());
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [especiales, setEspeciales] = useState<Especial[]>([]);
  const [campeonReal, setCampeonReal] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    Promise.all([fetchPartidos(), fetchPredicciones(), fetchEspeciales(), fetchCampeonReal()])
      .then(([pa, pr, es, cr]) => { setPartidos(pa); setPredicciones(pr); setEspeciales(es); setCampeonReal(cr); })
      .finally(() => setCargando(false));
  }, [usuario]);

  function onSavedEspecial(e: Especial) {
    setEspeciales(prev => {
      const otras = prev.filter(x => !(x.usuario === e.usuario && x.tipo === e.tipo));
      return [...otras, e];
    });
  }

  function onSavedMany(saved: Prediccion[]) {
    if (saved.length === 0) return;
    setPredicciones(prev => {
      const claves = new Set(saved.map(s => s.partido_id + s.usuario));
      const otras = prev.filter(x => !claves.has(x.partido_id + x.usuario));
      return [...otras, ...saved];
    });
  }

  return (
    <>
      <BackgroundFx />
      {!usuario
        ? <AccessGate onUnlocked={setUsuario} />
        : cargando
          ? <p className="text-center py-20 opacity-60">Cargando…</p>
          : <Shell usuario={usuario} partidos={partidos} predicciones={predicciones}
              especiales={especiales} campeonReal={campeonReal}
              onSavedMany={onSavedMany} onSavedEspecial={onSavedEspecial} />}
    </>
  );
}
