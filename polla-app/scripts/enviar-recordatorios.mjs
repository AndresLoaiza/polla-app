// Envia Web Push a quien le falte predecir un partido que cierra pronto.
// Corre en el cron. Env: VAPID_PUBLIC, VAPID_PRIVATE, SUPABASE_URL, SUPABASE_SERVICE_KEY
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const { VAPID_PUBLIC, VAPID_PRIVATE, SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
webpush.setVapidDetails('mailto:andres.9438@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const LOCK_MS = 10 * 60 * 1000;
const VENTANA_MS = 3 * 60 * 60 * 1000;   // avisar si el cierre cae dentro de 3h
const BASE = 'https://andresloaiza.github.io/polla-app/';
const USUARIOS = ['andres', 'melisa'];
const ahora = Date.now();

const { data: partidos } = await supabase
  .from('polla_partidos').select('id,fecha_hora,equipo_local,equipo_visitante')
  .gte('fecha_hora', new Date(ahora).toISOString());

const proximos = (partidos ?? []).filter((p) => {
  const cierre = new Date(p.fecha_hora).getTime() - LOCK_MS;
  return cierre > ahora && cierre <= ahora + VENTANA_MS;
});
if (proximos.length === 0) { console.log('Sin partidos en ventana'); process.exit(0); }

const { data: preds } = await supabase.from('polla_predicciones').select('partido_id,usuario');
const { data: subs } = await supabase.from('polla_push_subs').select('*');
const tienePred = new Set((preds ?? []).map((p) => p.partido_id + p.usuario));

let enviados = 0;
for (const u of USUARIOS) {
  const faltan = proximos.filter((p) => !tienePred.has(p.id + u));
  const userSubs = (subs ?? []).filter((s) => s.usuario === u);
  if (faltan.length === 0 || userSubs.length === 0) continue;

  const payload = JSON.stringify({
    title: '⚽ Polla Mundial 2026',
    body: faltan.length === 1
      ? `Te falta predecir ${faltan[0].equipo_local} vs ${faltan[0].equipo_visitante}`
      : `Te faltan ${faltan.length} predicciones que cierran pronto`,
    url: BASE,
  });

  for (const s of userSubs) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload);
      enviados++;
    } catch (e) {
      if (e.statusCode === 404 || e.statusCode === 410) {
        await supabase.from('polla_push_subs').delete().eq('endpoint', s.endpoint);
      }
    }
  }
}
console.log(`Recordatorios enviados: ${enviados}`);
