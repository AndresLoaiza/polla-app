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
  const [refrescando, setRefrescando] = useState(false);

  const cargarDatos = useCallback(async () => {
    const [pa, pr, es, cr] = await Promise.all(
      [fetchPartidos(), fetchPredicciones(), fetchEspeciales(), fetchCampeonReal()]);
    setPartidos(pa); setPredicciones(pr); setEspeciales(es); setCampeonReal(cr);
  }, []);

  // Marcadores en vivo (Edge Function): fusiona parcial Y estado por ext_id, asi
  // un partido que arranca aparece "en vivo" sin esperar al cron. Silencioso.
  const traerVivo = useCallback(async () => {
    try {
      const vivos = await fetchMarcadoresVivo();
      if (vivos.length === 0) return;
      const porExt = new Map(vivos.map(v => [v.ext_id, v]));
      setPartidos(prev => prev.map(p => {
        const v = porExt.get(p.ext_id);
        return v ? { ...p, gol_local_real: v.gol_local, gol_visitante_real: v.gol_visitante, estado: v.estado } : p;
      }));
    } catch { /* silencioso: queda el refresco normal */ }
  }, []);

  const refrescarManual = useCallback(async () => {
    setRefrescando(true);
    try { await cargarDatos(); await traerVivo(); }
    catch { /* silencioso */ }
    finally { setRefrescando(false); }
  }, [cargarDatos, traerVivo]);

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

  // Poll de marcador en vivo cada 30s si hay (o podria haber) un partido en curso:
  // ya en_juego, o con horario ya iniciado y sin finalizar dentro de una ventana
  // de ~3.5h (90'+prorroga+penales+margen). Asi descubrimos partidos recien
  // arrancados antes de que el cron los marque.
  const VENTANA_VIVO_MS = 3.5 * 60 * 60 * 1000;
  const ahoraMs = Date.now();
  const hayVivoPosible = partidos.some(p => {
    if (p.estado === 'finalizado') return false;
    if (p.estado === 'en_juego') return true;
    const inicio = new Date(p.fecha_hora).getTime();
    return inicio <= ahoraMs && ahoraMs - inicio < VENTANA_VIVO_MS;
  });
  useEffect(() => {
    if (!usuario || !hayVivoPosible) return;
    const tick = () => { if (document.visibilityState === 'visible') traerVivo(); };
    tick();
    const id = setInterval(tick, VIVO_MS);
    return () => clearInterval(id);
  }, [usuario, hayVivoPosible, traerVivo]);

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
              onSavedMany={onSavedMany} onSavedEspecial={onSavedEspecial}
              onRefresh={refrescarManual} refrescando={refrescando} />}
    </>
  );
}
