# Cambios — Puntuación justa y UX de predicciones

Iteración sobre la experiencia de predicciones, la puntuación y los avisos de
cierre. Rama `claude/scoring-match-display-wi08fv` · PR #1.

## 1. Puntuación solo de partidos que ambos predijeron
- `src/lib/standings.ts`: un partido finalizado **solo se puntúa si los dos**
  usuarios hicieron su predicción. Si a alguno le falta, ese partido no cuenta
  para ninguno (no es justo comparar contra una no-predicción).
- Tests actualizados en `src/lib/standings.test.ts` + caso nuevo
  ("ignora partidos donde alguno de los dos no predijo").

## 2. Marcadores sin `0` por defecto
- `ScoreInput`, `PartidoRow`, `PartidosView`: cuando **no hay predicción
  guardada**, el marcador se muestra **vacío (`–`)** en lugar de `0`, para no
  confundir "sin jugar" con un "0-0" guardado.
- Solo se pueden guardar predicciones **completas** (ambos marcadores).

## 3. Partidos de hoy en la pestaña "Partidos"
- `PartidosView` / `TodayView`: un partido de hoy sigue visible en **Partidos**
  (y en **Hoy**) aunque ya haya terminado, en vez de pasar solo a "Jugados".
- Helper `esHoy` compartido en `src/lib/torneo.ts`.

## 4. Hora del partido en vez de cuenta regresiva
- `PartidoRow`: se muestra el día y la hora del partido en la **zona horaria
  local** del dispositivo (`toLocaleString('es-CO', …)`), en lugar de
  "cierra en Xh".

## 5. Avisos de cierre de edición
- `PartidoRow`: **letrero rojo** "¡La edición se cierra en `Xh Ym`!" cuando
  falta **1 hora o menos** para el cierre (inicio − 10 min).
- `MatchDetail`: **nota discreta** "Edición cerrada" en partidos bloqueados que
  aún no se juegan (no aparece en los finalizados, que ya muestran marcador).

## Verificación
- `npx tsc --noEmit` sin errores.
- `npx vitest run` → 17 tests verdes.
- `npm run build` OK.
