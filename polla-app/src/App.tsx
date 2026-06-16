import { useEffect, useState } from 'react';
import AccessGate from './components/gate/AccessGate';
import Shell from './components/shell/Shell';
import { getStoredUsuario } from './lib/identity';
import { fetchPartidos, fetchPredicciones } from './lib/db';
import type { Partido, Prediccion, Usuario } from './types';

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(getStoredUsuario());
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    Promise.all([fetchPartidos(), fetchPredicciones()])
      .then(([pa, pr]) => { setPartidos(pa); setPredicciones(pr); })
      .finally(() => setCargando(false));
  }, [usuario]);

  function onSaved(p: Prediccion) {
    setPredicciones(prev => {
      const otras = prev.filter(x => !(x.partido_id === p.partido_id && x.usuario === p.usuario));
      return [...otras, p];
    });
  }

  if (!usuario) return <AccessGate onUnlocked={setUsuario} />;
  if (cargando) return <p className="text-center py-20 opacity-60">Cargando…</p>;
  return <Shell usuario={usuario} partidos={partidos} predicciones={predicciones} onSaved={onSaved} />;
}
