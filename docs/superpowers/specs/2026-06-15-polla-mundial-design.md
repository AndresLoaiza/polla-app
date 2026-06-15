# Polla Mundial 2026 — Diseño

> Fecha: 2026-06-15 · Estado: aprobado por Andrés
> App privada de apuestas de marcadores entre 2 personas (Andrés y Melisa) para el Mundial 2026, desde el 16 de junio 2026 en adelante.

## 1. Objetivo

App web instalable (PWA) donde Andrés y Melisa predicen el marcador de cada
partido del Mundial 2026. Suma puntos según el reglamento de la "polla"
colombiana. Datos compartidos en tiempo real. Solo cuentan partidos con fecha
de inicio **>= 2026-06-16**.

## 2. Stack (clon de `viajes-app`, ya probado)

| Capa | Tecnología |
|------|-----------|
| Framework | Vite + React 19 + TypeScript |
| Estilos | Tailwind v4 (`@tailwindcss/vite`) |
| Motion | framer-motion 12.40 (LazyMotion domMax, reducedMotion="user") |
| Iconos | lucide-react |
| Datos compartidos | Supabase (`@supabase/supabase-js`) — proyecto `nuestros-viajes` |
| PWA | vite-plugin-pwa (instalable en celular) |
| Hosting | GitHub Pages vía GitHub Action |
| Imágenes | Ideogram (`IDEOGRAM_API_KEY`, patrón `tools/ideogram_gen.py`) |

Ruta del proyecto: `D:\ANDRES\Claude_Projects\Polla_Mundial`.
Cliente Supabase idéntico al de viajes-app (`src/lib/supabase.ts`).

## 3. Arquitectura

GitHub Pages es estático (sin servidor). Los datos compartidos y los resultados
viven en Supabase:

- **Frontend** (React en GitHub Pages): lee partidos/predicciones/resultados de
  Supabase; escribe predicciones; calcula y muestra la tabla.
- **Sync de resultados**: una **GitHub Action cron** (cada ~2h) llama a
  football-data.org, mapea los partidos del Mundial y hace upsert de los
  marcadores reales en `polla_partidos`. La API key vive solo en *secrets* del
  repo, nunca en el cliente.
- **Fallback manual**: la app permite editar el marcador real a mano si la API
  se atrasa o no cubre el Mundial en el free tier.

## 4. Modelo de datos (Supabase, prefijo `polla_`)

### `polla_partidos`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| ext_id | text unique | id del partido en football-data.org (para upsert) |
| fase | text | `grupos` \| `eliminacion` |
| grupo | text null | ej. "A" (solo fase de grupos) |
| fecha_hora | timestamptz | UTC, hora oficial de inicio |
| equipo_local | text | |
| equipo_visitante | text | |
| bandera_local | text null | url/emoji |
| bandera_visitante | text null | |
| gol_local_real | int null | null hasta que se juegue |
| gol_visitante_real | int null | |
| estado | text | `programado` \| `en_juego` \| `finalizado` |

### `polla_predicciones`
| Columna | Tipo | Notas |
|---------|------|-------|
| id | uuid PK | |
| partido_id | uuid FK → polla_partidos | |
| usuario | text | `andres` \| `melisa` |
| gol_local | int | |
| gol_visitante | int | |
| updated_at | timestamptz | |
| | | **unique(partido_id, usuario)** |

### `polla_especiales` (Fase 2)
Apuestas tipo campeón / goleador, con sus propios puntos. No se implementa en
Fase 1.

### RLS
App privada detrás del gate de acceso. `anon` puede leer todo. Insert/update de
`polla_predicciones` permitido para `anon`. El bloqueo de tiempo se valida en la
app; opcionalmente un trigger en DB rechaza writes cuando
`now() > fecha_hora - interval '10 min'`.

## 5. Puntaje (`src/lib/scoring.ts`, TDD)

Implementa el reglamento. `mult = fase === 'eliminacion' ? 2 : 1`.

| Concepto | Condición | Puntos |
|----------|-----------|--------|
| Resultado (ganador/empate) | `sign(pl−pv) === sign(al−av)` | 5 × mult |
| Goles local | `pl === al` | 2 × mult |
| Goles visitante | `pv === av` | 2 × mult |
| Diferencia de goles | `(pl−pv) === (al−av)` (con signo) | 1 × mult |

Donde `p*` = predicción, `a*` = real. `sign` ∈ {−1, 0, 1} cubre gana/empate/gana.
La función devuelve el **desglose** `{ resultado, golLocal, golVisitante, diferencia, total }`
para la vista de puntos por partido.

Casos de prueba (de los ejemplos del reglamento):
- pred `1:0`, real `1:0`, grupos → total **10**; eliminación → **20**.
- pred `2:0`, real `3:1`, grupos → total **6** (resultado 5 + diferencia 1);
  eliminación → **12**.
- pred `1:1`, real `2:2`, grupos → total **6** (resultado 5 + diferencia 1).
- pred `0:2`, real `3:1`, grupos → total **0** (signo de diferencia opuesto).

## 6. Tabla de posiciones

Suma de `total` por usuario sobre partidos finalizados. Desempate por número de
partidos con **puntaje pleno** (10 en grupos / 20 en eliminación), luego 7, luego
6, luego 5 — como indica el reglamento.

## 7. Pantallas

1. **Gate de acceso** — código compartido hasheado SHA-256 (`VITE_ACCESS_CODE_HASH`,
   patrón viajes-app) → selección "¿Quién eres? Andrés / Melisa", guardado en
   localStorage.
2. **Hoy** (home) — partidos del día: estado de tu predicción, countdown al
   cierre (inicio − 10 min), predecir inline.
3. **Fixtures** — lista por día/fase; predecir cada partido; **bloqueado** a 10
   min del inicio.
4. **Detalle de partido** — tu predicción + la del otro (**oculta hasta que
   inicia el bloqueo**, es decir inicio − 10 min, para que nadie copie),
   marcador real, desglose de puntos.
5. **Posiciones** — total, plenos, desempate.

Estilo: **liquid glass** (glassmorphism estilo Apple) — capas translúcidas con
`backdrop-blur`, bordes claros sutiles, sombras suaves, brillo especular en los
bordes, profundidad por capas. Fondo temático Mundial 2026 (hero/gráficos con
Ideogram) detrás del vidrio. Motion con framer-motion (suave, springs).
Tokens de vidrio reutilizables en Tailwind/`index.css` (ej. `.glass`, `.glass-card`).
Respetar `prefers-reduced-motion` y mantener contraste/legibilidad sobre el blur.

## 8. Reglas de negocio

- **Bloqueo:** una predicción se puede crear/editar hasta `inicio − 10 min`.
  Después queda fija. Validado en la app.
- **Revelar predicción del rival:** se muestra al iniciar el bloqueo
  (`inicio − 10 min`), no antes.
- **Filtro de fecha:** solo se cargan/muestran partidos con
  `fecha_hora >= 2026-06-16`.

## 9. Sync de resultados (GitHub Action)

- `scripts/sync-resultados.mjs`: fetch a football-data.org (competición Mundial),
  mapea partidos desde 2026-06-16, upsert en `polla_partidos` por `ext_id`
  (fecha, equipos, estado, marcadores reales). Usa Supabase **service role key** +
  `FOOTBALL_DATA_TOKEN`, ambos desde *secrets*.
- `scripts/seed-partidos.mjs`: poblar fixtures iniciales (una vez) para que la app
  funcione antes del primer cron.
- `.github/workflows/sync.yml`: `cron: '0 */2 * * *'` + `workflow_dispatch`.
- Si el free tier no cubre el Mundial 2026: caer a entrada manual de fixtures +
  marcadores (la app ya soporta editar el real a mano).

## 10. Alcance / Fases

**Fase 1 (esta):** gate + identidad, fixtures vía API (con seed), predecir +
bloqueo, scoring + desglose, tabla de posiciones, vista Hoy, cron de resultados,
deploy a GitHub Pages.

**Fase 2 (después):** recordatorio PWA (notificación si falta predecir un partido
próximo), apuestas especiales (campeón, goleador).

## 11. Convenciones

- Commits en español sin tildes, prefijos `feat:/fix:/docs:/chore:/refactor:/test:`.
- Tests (vitest) antes de commit. Scoring 100% cubierto por tests.
- `.env` nunca se commitea; secrets en GitHub Action.
