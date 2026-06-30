import { useCallback, useEffect, useState } from 'react';
import AccessGate from './components/gate/AccessGate';
import Shell from './components/shell/Shell';
import BackgroundFx from './components/fx/BackgroundFx';
import { getStoredUsuario } from './lib/identity';
import { fetchPartidos, fetchPredicciones, fetchEspeciales, fetchCampeonReal } from './lib/db';
import { fetchMarcadoresVivo } from './lib/vivo';
import type { Partido, Prediccion, Especial, Usuario } from './types';

// Refresco automatico de datos en segundo plano. El sync de resultados corre
// cada 15 min; 2 min mantiene la app al dia sin recargar a mano.
const REFRESH_MS = 2 * 60 * 1000;
// Mientras hay un partido en juego, consultamos el marcador en vivo (Edge
// Function) mas seguido para que el parcial se mueva casi en tiempo real.
const VIVO_MS = 30 * 1000;

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(getStoredUsuario());
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [especiales, setEspeciales] = useState<Especial[]>([]);
  const [campeonReal, setCampeonReal] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  const cargarDatos = useCallback(async () => {
    const [pa, pr, es, cr] = await Promise.all(
      [fetchPartidos(), fetchPredicciones(), fetchEspeciales(), fetchCampeonReal()]);
    setPartidos(pa); setPredicciones(pr); setEspeciales(es); setCampeonReal(cr);
  }, []);

  useEffect(() => {
    if (!usuario) return;
    cargarDatos().catch(() => {}).finally(() => setCargando(false));

    // Refresco silencioso: por intervalo y al volver a la app (foco/visibilidad),
    // solo si la pestana esta visible. Los errores se ignoran para no romper la UI.
    const refrescar = () => {
      if (document.visibilityState === 'visible') cargarDatos().catch(() => {});
    };
    const id = setInterval(refrescar, REFRESH_MS);
    document.addEventListener('visibilitychange', refrescar);
    window.addEventListener('focus', refrescar);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', refrescar);
      window.removeEventListener('focus', refrescar);
    };
  }, [usuario, cargarDatos]);

  // Marcador en vivo: mientras haya un partido en juego, poll a la Edge Function
  // cada 30s y fusiona los parciales por ext_id. Degradacion silenciosa: si la
  // función no está desplegada o falla, queda el refresco normal.
  const hayEnJuego = partidos.some(p => p.estado === 'en_juego');
  useEffect(() => {
    if (!usuario || !hayEnJuego) return;
    let activo = true;
    const tick = async () => {
      try {
        const vivos = await fetchMarcadoresVivo();
        if (!activo || vivos.length === 0) return;
        const porExt = new Map(vivos.map(v => [v.ext_id, v]));
        setPartidos(prev => prev.map(p => {
          const v = porExt.get(p.ext_id);
          return v ? { ...p, gol_local_real: v.gol_local, gol_visitante_real: v.gol_visitante } : p;
        }));
      } catch { /* silencioso */ }
    };
    tick();
    const id = setInterval(() => { if (document.visibilityState === 'visible') tick(); }, VIVO_MS);
    return () => { activo = false; clearInterval(id); };
  }, [usuario, hayEnJuego]);

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
