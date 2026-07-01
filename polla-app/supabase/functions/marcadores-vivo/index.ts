// Edge Function: marcadores.
//
// Proxy del lado servidor a football-data.org para traer el estado y marcador
// ACTUAL de todos los partidos, sin exponer el token en el cliente. La app la usa
//   (1) al pulsar "actualizar" / pull-to-refresh, y
//   (2) en poll cada ~30s mientras hay un partido en curso,
// y superpone el resultado sobre lo que vino de la base. Asi "actualizar" trae el
// marcador actual desde la fuente, no la copia (posiblemente vieja) del cron.
//
// Deploy (una vez, Supabase CLI logueado en el proyecto):
//   supabase secrets set FOOTBALL_DATA_TOKEN=<token>
//   supabase functions deploy marcadores-vivo
//
// Se invoca con supabase.functions.invoke('marcadores-vivo') (adjunta la anon key).
// Devuelve: { partidos: [{ ext_id, gol_local, gol_visitante, estado }] }.

interface Cuadro { home: number | null; away: number | null }
interface Score { duration?: string; regularTime?: Cuadro; fullTime?: Cuadro; penalties?: Cuadro }
interface Match { id: number; status: string; utcDate: string; score?: Score }

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

const estadoDe = (s: string) =>
  s === 'FINISHED' ? 'finalizado' : (s === 'IN_PLAY' || s === 'PAUSED') ? 'en_juego' : 'programado';

// Igual que el sync: la tanda de penales no cuenta en el marcador; el resultado
// en juego esta en regularTime cuando hubo penales, si no en fullTime.
const marcador = (sc?: Score): Cuadro => {
  if (!sc) return { home: null, away: null };
  const huboPenales = sc.duration === 'PENALTY_SHOOTOUT' || sc.penalties != null;
  return (huboPenales ? (sc.regularTime ?? sc.fullTime) : sc.fullTime) ?? { home: null, away: null };
};

const DESDE = new Date('2026-06-16T00:00:00Z');
const TTL_MS = 10_000;   // cache corto por isolate para cuidar la cuota (10 req/min)
let cache: { ts: number; body: unknown } | null = null;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const token = Deno.env.get('FOOTBALL_DATA_TOKEN');
  if (!token) return json({ error: 'falta FOOTBALL_DATA_TOKEN' }, 500);

  if (cache && Date.now() - cache.ts < TTL_MS) return json(cache.body);

  try {
    const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
      headers: { 'X-Auth-Token': token },
    });
    if (!res.ok) return json({ error: `API ${res.status}` }, 502);
    const { matches = [] } = await res.json() as { matches?: Match[] };

    const partidos = matches
      .filter((m) => new Date(m.utcDate) >= DESDE)
      .map((m) => {
        const mr = marcador(m.score);
        return {
          ext_id: String(m.id),
          gol_local: mr.home ?? null,
          gol_visitante: mr.away ?? null,
          estado: estadoDe(m.status),
        };
      });

    const body = { partidos };
    cache = { ts: Date.now(), body };
    return json(body);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
