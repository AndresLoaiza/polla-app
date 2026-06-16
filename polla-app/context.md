# context.md — Polla Mundial 2026

## Qué es
App web/PWA privada para que **Andrés y Melisa** apuesten el marcador de cada
partido del Mundial 2026 (desde el 16 de junio) y compitan por puntos según el
reglamento colombiano de "polla". Dos usuarios, datos compartidos en tiempo real.

- **En vivo:** https://andresloaiza.github.io/polla-app/
- **Acceso:** código `mundial2026` → elegir Andrés (rojo) o Melisa (morado).

## Reglamento de puntaje
Por partido predices el marcador exacto y sumas por cada acierto:

| Concepto | Grupos | Eliminación |
|----------|:------:|:-----------:|
| Acertar resultado (ganador/empate) | 5 | 10 |
| Goles exactos del local | 2 | 4 |
| Goles exactos del visitante | 2 | 4 |
| Diferencia de goles | 1 | 2 |
| **Máximo** | **10** | **20** |

Desempate en la tabla: más partidos con puntaje pleno, luego 7, 6, 5.
**Apuesta especial:** Campeón del Mundial = +20 pts.

## Pantallas
- **Hoy** — partidos del día.
- **Partidos** — próximos por predecir (de a 10, guardado en lote con un botón).
- **Jugados** — finalizados con marcador real + desglose de puntos.
- **Tabla** — posiciones + bonus campeón + selector de campeón.
- Header: 🔔 recordatorios push · ? explicación de puntaje.

## Reglas clave
- Predicción editable hasta 10 min antes del inicio; ahí se bloquea y se revela
  la del rival (para que nadie copie).
- El campeón se elige hasta que empiece la fase de eliminación.

## Identidad visual
- Estilo **liquid glass** sobre fondo de estadio nocturno (imagen Ideogram).
- Temática futbolera: verde cancha + acentos dorados.
- Color por usuario: **Melisa morado**, **Andrés rojo** (en toda la app).

## Estado
Fase 1 + Fase 2 completas y desplegadas. Resultados se actualizan solos (cron
football-data.org). Recordatorios push activos. Único pendiente: registrar el
campeón real en `polla_especiales_resultado` cuando termine el torneo.

## Diseño / planes
`docs/superpowers/specs/` y `docs/superpowers/plans/` (en la raíz del repo
`Polla_Mundial`). Memoria del proyecto: vault Obsidian `vida_personal/polla-mundial.md`.
