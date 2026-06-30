// Logica compartida: jala el fixture del Mundial de football-data.org y hace
// upsert en polla_partidos (por ext_id). Seed y sync usan esto mismo: traen
// equipos, horarios, estado y marcadores reales en una sola pasada.
import { createClient } from '@supabase/supabase-js';

const faseDe = (stage) => (stage === 'GROUP_STAGE' ? 'grupos' : 'eliminacion');
const estadoDe = (s) =>
  s === 'FINISHED' ? 'finalizado' : (s === 'IN_PLAY' || s === 'PAUSED') ? 'en_juego' : 'programado';

// El marcador del partido son los goles en juego, NO la tanda de penales que
// decide quien avanza. Dato real del feed (Alemania-Paraguay): para un partido
// por penales, score.fullTime trae la tanda SUMADA (p. ej. 4-5), y el resultado
// real esta en score.regularTime (1-1). Por eso, con tanda usamos regularTime;
// sin tanda, fullTime ya es el resultado final (incluye goles de prorroga).
const marcadorEnJuego = (sc) => {
  if (!sc) return {};
  const huboPenales = sc.duration === 'PENALTY_SHOOTOUT' || sc.penalties != null;
  return huboPenales ? (sc.regularTime ?? sc.fullTime ?? {}) : (sc.fullTime ?? {});
};

async function fetchConRetry(url, opts, intentos = 3) {
  for (let i = 0; i < intentos; i++) {
    try {
      return await fetch(url, opts);
    } catch (err) {
      if (i === intentos - 1) throw err;
      const espera = 5000 * (i + 1);
      console.warn(`fetch falló (intento ${i + 1}/${intentos}): ${err.message}. Reintentando en ${espera / 1000}s…`);
      await new Promise(r => setTimeout(r, espera));
    }
  }
}

export async function sincronizarFixtures() {
  const { FOOTBALL_DATA_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!FOOTBALL_DATA_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Faltan env: FOOTBALL_DATA_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY');
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const res = await fetchConRetry('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': FOOTBALL_DATA_TOKEN },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  const { matches } = await res.json();

  const filas = matches
    .filter((m) => new Date(m.utcDate) >= new Date('2026-06-16T00:00:00Z'))
    .map((m) => {
      const mr = marcadorEnJuego(m.score);
      return {
        ext_id: String(m.id),
        fase: faseDe(m.stage),
        grupo: m.group ? m.group.replace('GROUP_', '') : null,
        fecha_hora: m.utcDate,
        equipo_local: m.homeTeam?.name ?? 'Por definir',
        equipo_visitante: m.awayTeam?.name ?? 'Por definir',
        bandera_local: m.homeTeam?.crest ?? null,
        bandera_visitante: m.awayTeam?.crest ?? null,
        gol_local_real: mr.home ?? null,
        gol_visitante_real: mr.away ?? null,
        estado: estadoDe(m.status),
      };
    });

  // Diagnostico: deja claro en el log que devuelve la API y que queda tras el
  // filtro, para detectar si faltan partidos futuros (p. ej. limite del plan
  // free) o si solo estan como "Por definir" (bracket aun sin resolver).
  const ahora = new Date();
  const cuenta = (arr, fn) => arr.reduce((acc, x) => { const k = fn(x); acc[k] = (acc[k] ?? 0) + 1; return acc; }, {});
  const futuros = filas.filter((f) => new Date(f.fecha_hora) > ahora);
  const fechas = filas.map((f) => f.fecha_hora).sort();
  const porDefinir = filas.filter((f) => f.equipo_local === 'Por definir' || f.equipo_visitante === 'Por definir').length;
  console.log(`API total: ${matches.length} | tras filtro (>=2026-06-16): ${filas.length}`);
  console.log(`Por fase: ${JSON.stringify(cuenta(filas, (f) => f.fase))}`);
  console.log(`Por estado: ${JSON.stringify(cuenta(filas, (f) => f.estado))}`);
  console.log(`Futuros (fecha > ahora): ${futuros.length} | con "Por definir": ${porDefinir}`);
  console.log(`Rango fechas: ${fechas[0] ?? 'n/a'} -> ${fechas[fechas.length - 1] ?? 'n/a'}`);
  const conPenales = matches.filter((m) => m.score?.penalties != null || m.score?.duration === 'PENALTY_SHOOTOUT');
  for (const m of conPenales) {
    const s = m.score ?? {};
    const par = (x) => `${x?.home ?? '-'}-${x?.away ?? '-'}`;
    console.log(`Penales ${m.homeTeam?.name} vs ${m.awayTeam?.name}: marcador(fullTime) ${par(s.fullTime)} | regularTime ${par(s.regularTime)} | extraTime ${par(s.extraTime)} | tanda ${par(s.penalties)} (no cuenta)`);
  }

  const { error } = await supabase.from('polla_partidos').upsert(filas, { onConflict: 'ext_id' });
  if (error) throw error;
  return filas.length;
}
