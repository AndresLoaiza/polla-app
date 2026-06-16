// Logica compartida: jala el fixture del Mundial de football-data.org y hace
// upsert en polla_partidos (por ext_id). Seed y sync usan esto mismo: traen
// equipos, horarios, estado y marcadores reales en una sola pasada.
import { createClient } from '@supabase/supabase-js';

const faseDe = (stage) => (stage === 'GROUP_STAGE' ? 'grupos' : 'eliminacion');
const estadoDe = (s) =>
  s === 'FINISHED' ? 'finalizado' : (s === 'IN_PLAY' || s === 'PAUSED') ? 'en_juego' : 'programado';

export async function sincronizarFixtures() {
  const { FOOTBALL_DATA_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
  if (!FOOTBALL_DATA_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Faltan env: FOOTBALL_DATA_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY');
  }
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
    headers: { 'X-Auth-Token': FOOTBALL_DATA_TOKEN },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  const { matches } = await res.json();

  const filas = matches
    .filter((m) => new Date(m.utcDate) >= new Date('2026-06-16T00:00:00Z'))
    .map((m) => ({
      ext_id: String(m.id),
      fase: faseDe(m.stage),
      grupo: m.group ? m.group.replace('GROUP_', '') : null,
      fecha_hora: m.utcDate,
      equipo_local: m.homeTeam?.name ?? 'Por definir',
      equipo_visitante: m.awayTeam?.name ?? 'Por definir',
      bandera_local: m.homeTeam?.crest ?? null,
      bandera_visitante: m.awayTeam?.crest ?? null,
      gol_local_real: m.score?.fullTime?.home ?? null,
      gol_visitante_real: m.score?.fullTime?.away ?? null,
      estado: estadoDe(m.status),
    }));

  const { error } = await supabase.from('polla_partidos').upsert(filas, { onConflict: 'ext_id' });
  if (error) throw error;
  return filas.length;
}
