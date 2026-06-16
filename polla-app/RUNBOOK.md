# RUNBOOK.md — Operación Polla Mundial 2026

Tareas operativas. Requieren credenciales (ver `.env` / secrets del repo).

## URLs
- App: https://andresloaiza.github.io/polla-app/  (código `mundial2026`)
- Repo: https://github.com/AndresLoaiza/polla-app (público)
- Supabase: proyecto `nuestros-viajes` (dashboard → SQL/Table editor)

## Cargar / actualizar partidos
Automático: `sync.yml` cada 2h. Manual:
```
gh workflow run sync.yml
```
Local (PowerShell, en `polla-app/`):
```
$env:FOOTBALL_DATA_TOKEN="<token>"; $env:SUPABASE_URL="https://gbfxpzsblnrasfvxnquk.supabase.co"; $env:SUPABASE_SERVICE_KEY="<service_role>"
node scripts/seed-partidos.mjs     # carga inicial
node scripts/sync-resultados.mjs   # actualizar marcadores
```

## Definir el campeón real (al terminar el torneo)
Resuelve la apuesta especial (+20 a quien acertó). En SQL editor de Supabase:
```sql
insert into polla_especiales_resultado (tipo, valor)
values ('campeon', '<NombreEquipoComoEnLaAPI>')
on conflict (tipo) do update set valor = excluded.valor;
```
El nombre debe ser el de la API (ej. `Brazil`, `Argentina`), no el español.

## Recordatorios push
Automático: `recordatorios.yml` cada 30 min (avisa si falta predecir un partido
que cierra en <3h). Probar manual:
```
gh workflow run recordatorios.yml
gh run watch $(gh run list --workflow=recordatorios.yml --limit 1 --json databaseId --jq '.[0].databaseId')
```
Para que llegue, el usuario debe haber activado la 🔔 (suscripción en
`polla_push_subs`) y tener un partido sin predecir cerca.

## Deploy
Push a `main` dispara `deploy.yml`. Forzar:
```
gh workflow run deploy.yml
```

## Secrets del repo (Actions)
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ACCESS_CODE_HASH`, `FOOTBALL_DATA_TOKEN`,
`SUPABASE_SERVICE_KEY`, `VAPID_PUBLIC`, `VAPID_PRIVATE`.
```
gh secret set <NOMBRE> --body "<valor>"
gh secret list
```

## Rotar el código de acceso
Genera el hash y actualiza `.env` (local) + secret `ACCESS_CODE_HASH` (deploy):
```
node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode('NUEVOCODIGO')).then(b => console.log(Buffer.from(b).toString('hex')))"
```

## Troubleshooting
- **Push "no se pudo activar"**: requiere policy SELECT en `polla_push_subs`
  (el upsert hace INSERT...RETURNING). Ya está; si se recrea la tabla, re-aplicar
  `supabase/schema.sql`.
- **Cron falla "WebSocket / Node 20"**: los workflows deben usar `node-version: 22`
  (supabase-js requiere WebSocket nativo).
- **Cron falla "permission denied for table"**: faltan grants. Re-aplicar
  `grant select,insert,update,delete on <tabla> to service_role,anon,authenticated`.
- **API sin Mundial**: si football-data deja de exponer la competición `WC`,
  cargar partidos/resultados a mano (la app soporta marcador manual).
- **Ícono PWA viejo en el celular**: desinstalar y reinstalar la PWA.
- **iOS sin notificaciones**: solo funcionan con la PWA instalada (Agregar a inicio).
