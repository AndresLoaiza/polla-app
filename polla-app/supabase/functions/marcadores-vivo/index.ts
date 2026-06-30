// Edge Function: marcadores en vivo.
//
// Proxy del lado servidor a football-data.org para no exponer el token en el
// cliente. La app la invoca cada ~30s mientras hay un partido en juego y pinta
// el marcador parcial casi en tiempo real (sin esperar al cron de sync).
//
// Deploy (una vez, requiere Supabase CLI logueado en el proyecto):
//   supabase secrets set FOOTBALL_DATA_TOKEN=<token>
//   supabase functions deploy marcadores-vivo
//
// Se llama desde el cliente con supabase.functions.invoke('marcadores-vivo'),
// que adjunta la anon key como Authorization (mismo gate que el resto de la app).
//
// Devuelve: { partidos: [{ ext_id, gol_local, gol_visitante, estado }] } solo de
// los partidos en juego. El marcador es score.fullTime (la tanda de penales no
// aplica mientras el partido sigue en curso).

interface Score { fullTime?: { home: number | null; away: number | null } }
interface Match { id: number; status: string; score?: Score }

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

// Cache corto por isolate para no golpear la cuota del plan free (10 req/min)
// aunque ambos usuarios consulten a la vez.
const TTL_MS = 15_000;
let cache: { ts: number; body: unknown } | null = null;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const token = Deno.env.get('FOOTBALL_DATA_TOKEN');
  if (!token) return json({ error: 'falta FOOTBALL_DATA_TOKEN' }, 500);

  if (cache && Date.now() - cache.ts < TTL_MS) return json(cache.body);

  try {
    const res = await fetch(
      'https://api.football-data.org/v4/competitions/WC/matches?status=IN_PLAY,PAUSED',
      { headers: { 'X-Auth-Token': token } },
    );
    if (!res.ok) return json({ error: `API ${res.status}` }, 502);
    const { matches = [] } = await res.json() as { matches?: Match[] };

    const partidos = matches.map((m) => ({
      ext_id: String(m.id),
      gol_local: m.score?.fullTime?.home ?? 0,
      gol_visitante: m.score?.fullTime?.away ?? 0,
      estado: 'en_juego' as const,
    }));

    const body = { partidos };
    cache = { ts: Date.now(), body };
    return json(body);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
