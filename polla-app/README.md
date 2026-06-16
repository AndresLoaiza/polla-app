# Polla Mundial 2026

App privada para que Andrés y Melisa apuesten los marcadores de los partidos del
Mundial 2026 (desde el 16 de junio). Puntaje según el reglamento de la "polla".

## Stack
Vite + React 19 + TypeScript + Tailwind v4 + framer-motion + lucide-react +
Supabase + PWA. Estilo **liquid glass**. Colores: Melisa morado, Andrés rojo.

## Correr local
```powershell
cd polla-app
npm install
npm run dev        # http://localhost:5173
npm test           # vitest (puntaje, bloqueo, tabla)
npm run build
```
Requiere `polla-app/.env` (ver `.env.example`).

## Variables de entorno (`.env`, no se commitea)
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — proyecto Supabase `nuestros-viajes`.
- `VITE_ACCESS_CODE_HASH` — SHA-256 hex del código de acceso. El código actual es `mundial2026`.
- `IDEOGRAM_API_KEY` — generación de imágenes.

## Base de datos
Ejecutar `supabase/schema.sql` en el SQL Editor del proyecto Supabase (crea
`polla_partidos` y `polla_predicciones` con RLS).

## Cargar / actualizar partidos
```powershell
$env:FOOTBALL_DATA_TOKEN="<token football-data.org>"
$env:SUPABASE_URL="https://gbfxpzsblnrasfvxnquk.supabase.co"
$env:SUPABASE_SERVICE_KEY="<service_role_key>"
node scripts/seed-partidos.mjs     # carga inicial
node scripts/sync-resultados.mjs   # actualiza marcadores
```
El cron `.github/workflows/sync.yml` corre `sync-resultados.mjs` cada 2 horas.

## Deploy
Push a `main` dispara `.github/workflows/deploy.yml` → GitHub Pages.
El repo DEBE llamarse `polla-app` (coincide con `base` en `vite.config.ts`).

### Secrets requeridos en el repo (Settings → Secrets → Actions)
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `ACCESS_CODE_HASH`
- `FOOTBALL_DATA_TOKEN`
- `SUPABASE_SERVICE_KEY` (service role, solo para el cron)
