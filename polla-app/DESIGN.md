# DESIGN.md — Polla Mundial 2026

Sistema de diseño. Tokens en `src/index.css` (`@theme`).

## Estrategia de color
Comprometida con una temática (no "restrained"): fondo de estadio + glass, con
dos colores personales como acentos fuertes.

| Rol | Valor | Uso |
|-----|-------|-----|
| Fondo base | `#07120b` / `#0c1a12` | cuerpo, oscurísimo verdoso |
| Verde cancha | `--color-pitch` `#22c55e` · deep `#15803d` | acento activo (nav, franja, OK) |
| Dorado | `#eab308` | campeón, fin de la franja |
| **Usuario Melisa** | `--color-user-melisa` `#a855f7` (morado) | su nombre, fila, picks, anillo |
| **Usuario Andrés** | `--color-user-andres` `#ef4444` (rojo) | ídem |
| Texto | `#f5f5fa` | nunca `#fff` puro |

Regla dura: el color del usuario es consistente en TODA la app (predicciones,
tabla, desgloses, badges).

## Liquid glass
Clase `.glass`: `rgba(255,255,255,0.07)` + `backdrop-filter: blur(18px) saturate(140%)`,
borde `rgba(255,255,255,0.14)`, sombra suave + brillo interior superior.
`.glass-card` añade `border-radius: 1.25rem`. Es decisión central de marca (no
glass decorativo al azar): toda tarjeta/overlay/nav es glass sobre el estadio.

## Fondo
`BackgroundFx`: imagen de estadio nocturno (Ideogram, `public/bg-stadium.webp`,
atenuada) con scrim degradado encima para legibilidad. Fija detrás del contenido.
El cuerpo añade un degradado radial verde/morado + líneas tenues tipo cancha.

## Tipografía
Inter (system-ui fallback). Jerarquía por peso + escala: títulos `text-xl/2xl`
bold; cuerpo `text-sm`; metadatos `text-xs opacity-70`. Números con `tabular-nums`.

## Layout
- Móvil primero, contenedor `max-w-lg mx-auto`.
- Navegación inferior fija (glass) con 4 tabs: Hoy · Partidos · Jugados · Tabla.
- Cabecera: título + ⚽, botones glass circulares (🔔 recordatorios, ? puntaje),
  badge de usuario con su color, franja `pitch-stripe` (verde→dorado).
- **Fila de partido:** cada equipo es columna — bandera + nombre centrados sobre
  su propio marcador (stepper ± ). Nunca meter nombres + marcadores en una línea
  (se desbordan en móvil).
- Guardado en lote: un solo botón flotante, no uno por tarjeta.

## Motion
framer-motion. Entradas suaves (fade + y), overlays con spring (damping ~28, sin
rebote). Respetar `prefers-reduced-motion` (corta animaciones en `index.css`).

## Componentes clave
`GlassCard`, `ScoreInput` (stepper), `PartidoRow` (editable), `MatchDetail`
(cerrado + desglose), `CampeonCard`, `ScoringInfo` (hoja de puntaje), `BackgroundFx`.

## Iconografía
lucide-react. App icon (PWA): trofeo dorado full-bleed sobre gradiente morado→carmesí
(Ideogram). Banderas de equipos: emoji (`src/lib/equipos.ts`).
