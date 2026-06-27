# CLAUDE.md — Polla Mundial 2026

Guía para trabajar en este repo. App privada de apuestas de marcadores del
Mundial 2026 entre Andrés y Melisa.

## Stack (cerrado)
| Capa | Tecnología |
|------|-----------|
| Build | Vite + React 19 + TypeScript |
| Estilos | Tailwind v4 (`@tailwindcss/vite`, tokens en `src/index.css`) |
| Motion | framer-motion |
| Iconos | lucide-react |
| Datos | Supabase (`@supabase/supabase-js`), proyecto `nuestros-viajes` |
| PWA / Push | vite-plugin-pwa en modo **injectManifest** (`src/sw.ts`) |
| Hosting | GitHub Pages vía GitHub Action |
| Tests | vitest |

`base` de Vite = `/polla-app/`. El repo se llama `polla-app` (público).

## Comandos
```powershell
npm run dev      # localhost:5173
npm test         # vitest (scoring, lock, standings)
npm run build    # tsc && vite build (genera dist/ + sw.js)
```

## Arquitectura
- Frontend estático en Pages lee/escribe en Supabase (anon key, tras gate).
- 3 GitHub Actions (`.github/workflows/` en la **raíz** del repo, no en `polla-app/`):
  - `deploy.yml` — push a `main` → build → Pages.
  - `sync.yml` — cron 15min: jala resultados de football-data.org → `polla_partidos`.
  - `recordatorios.yml` — cron 30min: Web Push a quien le falte predecir un
    partido que cierra en <3h (`scripts/enviar-recordatorios.mjs`).

## Datos (Supabase, prefijo `polla_`)
- `polla_partidos` — fixtures + marcadores reales. `fase` = `grupos`|`eliminacion`.
- `polla_predicciones` — unique(partido_id, usuario). `usuario` = `andres`|`melisa`.
- `polla_especiales` — apuesta campeón. unique(usuario, tipo='campeon').
- `polla_especiales_resultado` — campeón real (tipo='campeon', valor=equipo).
- `polla_push_subs` — suscripciones Web Push (unique endpoint).
- RLS: anon lee todo; anon inserta/actualiza predicciones, especiales y subs. El
  cron (service_role) escribe partidos. **Las tablas se crearon como `postgres`
  por conexión directa; necesitaron GRANT explícito a service_role/anon/authenticated.**
- DDL de referencia: `supabase/schema.sql`.

## Lógica pura (con tests — no romper)
- `src/lib/scoring.ts` — `puntuar(pl,pv,al,av,fase)`. Reglamento: resultado 5/10,
  goles local 2/4, goles visitante 2/4, diferencia (con signo) 1/2.
- `src/lib/standings.ts` — `calcularTabla(partidos, preds, especiales?, campeonReal?)`.
  Desempate por plenos→7→6→5. Suma bonus campeón (20) al total.
- `src/lib/lock.ts` — bloqueo y revelado del rival = `inicio − 10 min`.

## Reglas de negocio
- Predicción editable hasta `inicio − 10 min`; ahí se bloquea y se revela la del rival.
- Apuesta de campeón cierra al empezar la eliminación (`inicioEliminacion`).
- Solo partidos con `fecha_hora >= 2026-06-16`.
- Nombres de equipos en español + bandera emoji: `src/lib/equipos.ts` (la API
  los da en inglés; la clave se normaliza para tolerar acentos).

## Convenciones
- Commits en español sin tildes: `feat:/fix:/docs:/chore:/refactor:/test:`.
- Tests antes de commit. Scoring/standings/lock cubiertos.
- `src/sw.ts` está **excluido** de `tsconfig.json` (usa libs WebWorker; lo compila vite-plugin-pwa).

## Gotchas
1. Workflows van en la RAÍZ del repo (`.github/workflows/`), no en `polla-app/`.
   GitHub no corre workflows en subdirectorios.
2. El cron usa **Node 22** (supabase-js requiere WebSocket nativo; Node 20 falla).
3. GitHub Pages no soporta repos privados en plan free → el repo es público. La
   anon key de Supabase es pública por diseño (cliente); los datos los protege RLS.
4. Ideogram: usar `tools/ideogram_gen.py` (truststore) de `D:\ANDRES\Claude_Projects\tools`.
5. iOS: Web Push solo funciona con la PWA instalada (Agregar a inicio).

## Secrets del repo (Actions)
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `ACCESS_CODE_HASH`, `FOOTBALL_DATA_TOKEN`,
`SUPABASE_SERVICE_KEY`, `VAPID_PUBLIC`, `VAPID_PRIVATE`. Valores locales en `.env`
(no se commitea; ver `.env.example`).
