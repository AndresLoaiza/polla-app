# CHANGELOG — Polla Mundial 2026

Fechas relativas a junio 2026.

## Fase 1 — base
- Scaffold Vite + React 19 + TS + Tailwind v4 + PWA (clon de viajes-app).
- Puntaje del reglamento con tests (resultado 5/10, goles 2/4, diferencia 1/2).
- Bloqueo y revelado del rival a 10 min del inicio; tabla con desempate por plenos.
- Supabase (`polla_partidos`, `polla_predicciones`) con RLS.
- Gate por código + selección Andrés/Melisa.
- Estilo liquid glass; Melisa morado, Andrés rojo.
- Deploy a GitHub Pages + cron de resultados (football-data.org).
- 89 partidos del Mundial cargados (desde 16-jun).

## Iteraciones de UI
- Guardado en lote (un botón), paginación de a 10, banderas, nombres en español.
- Temática futbolera (verde cancha), tab "Fixtures" → "Partidos".
- Fix: nombres ya no se desbordan (layout apilado, luego columnas centradas).
- Fondo de estadio (Ideogram) + ícono `?` con la tabla de puntaje.
- Pestaña "Jugados" aparte para los partidos finalizados.

## Fase 2
- **Apuesta Campeón del Mundial** (20 pts, cierra al empezar eliminación) con su
  card en Tabla y bonus al total.
- **Web Push real** (app cerrada): VAPID, Service Worker injectManifest,
  `polla_push_subs`, cron `recordatorios.yml` con `web-push`, botón campana.
- Fix: policy SELECT en `polla_push_subs` (el upsert RETURNING fallaba con RLS).
- Ícono PWA más grande (trofeo full-bleed).

## Docs
- README, CLAUDE.md, context.md, PRODUCT.md, DESIGN.md, RUNBOOK.md, este changelog.
