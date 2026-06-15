# Polla Mundial 2026 — Plan de Implementación (Fase 1)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** App web/PWA donde Andrés y Melisa predicen marcadores del Mundial 2026 (desde 16-jun-2026), con puntaje del reglamento, datos compartidos en Supabase, estilo liquid glass.

**Architecture:** Frontend Vite+React en GitHub Pages lee/escribe en Supabase. Una GitHub Action cron jala resultados de football-data.org y los guarda en Supabase. Lógica de puntaje y tabla en funciones puras con tests.

**Tech Stack:** Vite, React 19, TypeScript, Tailwind v4, framer-motion, lucide-react, @supabase/supabase-js, vite-plugin-pwa, vitest, gh-pages (clon de `viajes-app`).

**Spec:** `docs/superpowers/specs/2026-06-15-polla-mundial-design.md`

**Convención de commits:** español sin tildes, prefijos `feat:/fix:/docs:/chore:/refactor:/test:`. Tests antes de commit.

---

## Mapa de archivos

```
polla-app/
├── index.html
├── package.json
├── vite.config.ts
├── vitest.config.ts
├── tsconfig*.json
├── .env                      (no commit) — credenciales viajes-app reusadas
├── .env.example
├── .github/workflows/
│   ├── deploy.yml            despliegue a GitHub Pages
│   └── sync.yml              cron resultados
├── scripts/
│   ├── seed-partidos.mjs     poblar fixtures una vez
│   └── sync-resultados.mjs   upsert marcadores reales (cron)
├── supabase/schema.sql       DDL tablas + RLS
└── src/
    ├── main.tsx
    ├── App.tsx               gate → shell con tabs
    ├── index.css             tailwind @theme + tokens liquid glass + colores usuario
    ├── types.ts              Partido, Prediccion, Usuario, Fase, Desglose
    ├── lib/
    │   ├── supabase.ts       cliente
    │   ├── identity.ts       sha256 + gate + usuario en localStorage
    │   ├── scoring.ts        puntaje del reglamento (puro)
    │   ├── scoring.test.ts
    │   ├── standings.ts      tabla + desempate (puro)
    │   ├── standings.test.ts
    │   ├── lock.ts           bloqueo / revelado / countdown (puro)
    │   ├── lock.test.ts
    │   └── db.ts             lecturas/escrituras Supabase
    └── components/
        ├── gate/AccessGate.tsx
        ├── shell/Shell.tsx          tabs Hoy / Fixtures / Tabla
        ├── glass/GlassCard.tsx      primitiva liquid glass
        ├── partido/ScoreInput.tsx   stepper de goles
        ├── partido/PredictionCard.tsx
        ├── partido/MatchDetail.tsx  revelado + desglose
        ├── views/TodayView.tsx
        ├── views/FixturesView.tsx
        └── views/StandingsView.tsx
```

Trabajo dentro de `D:\ANDRES\Claude_Projects\Polla_Mundial`. El código de la app
va en una subcarpeta `polla-app/` (igual que `viajes-app/` en su repo).

---

## Task 1: Scaffold del proyecto

**Files:**
- Create: `polla-app/` (vite scaffold), `polla-app/vite.config.ts`, `polla-app/vitest.config.ts`, `polla-app/.env`, `polla-app/.env.example`, `polla-app/src/lib/supabase.ts`

- [ ] **Step 1: Crear scaffold Vite**

Run (PowerShell, desde `D:\ANDRES\Claude_Projects\Polla_Mundial`):
```powershell
npm create vite@latest polla-app -- --template react-ts
cd polla-app
npm install
npm install @supabase/supabase-js framer-motion lucide-react
npm install -D @tailwindcss/vite tailwindcss vite-plugin-pwa vitest jsdom gh-pages
```

- [ ] **Step 2: `vite.config.ts`** (base path = nombre del repo `polla-app`)

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/polla-app/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Polla Mundial 2026',
        short_name: 'Polla',
        description: 'Nuestra polla del Mundial 2026',
        lang: 'es',
        start_url: '/polla-app/',
        scope: '/polla-app/',
        display: 'standalone',
        theme_color: '#0b0b14',
        background_color: '#0b0b14',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        runtimeCaching: [{
          urlPattern: ({ url }) => url.hostname.endsWith('.supabase.co') && url.pathname.startsWith('/rest/'),
          handler: 'NetworkFirst',
          options: {
            cacheName: 'supabase-rest',
            networkTimeoutSeconds: 5,
            expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
            cacheableResponse: { statuses: [0, 200] },
          },
        }],
      },
    }),
  ],
})
```

- [ ] **Step 3: `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'jsdom', globals: true },
})
```

- [ ] **Step 4: `.env`** (reusa credenciales de viajes-app; NO commitear)

```
VITE_SUPABASE_URL=https://gbfxpzsblnrasfvxnquk.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_mRvhm4a-U8F9NqBNe4fNiQ_q_0cYLiD
VITE_ACCESS_CODE_HASH=REEMPLAZAR_EN_STEP_5
IDEOGRAM_API_KEY=um7wYFelm_rqdA4MKKUdT9TJ-0AuNBY-uWfoiGeWsg4HSe0D1397Y0PK_lZ8e_cE6cOH6ssRF1zbOACmPH2YHQ
```

`.env.example` igual pero con valores `REEMPLAZA`. Verificar que `.gitignore`
(raíz del repo, ya existe) cubre `.env` y `node_modules/` y `dist/`.

- [ ] **Step 5: Generar hash del código de acceso**

Run (elige el código que usarán; ejemplo `mundial2026`):
```powershell
node -e "crypto.subtle.digest('SHA-256', new TextEncoder().encode('mundial2026')).then(b => console.log(Buffer.from(b).toString('hex')))"
```
Pegar el hash en `VITE_ACCESS_CODE_HASH` del `.env`.

- [ ] **Step 6: `src/lib/supabase.ts`**

```ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
);
```

- [ ] **Step 7: Verificar build y arranque**

Run:
```powershell
npm run build
```
Expected: build OK (genera `dist/`). Si falla por PWA icons faltantes, ignorar
hasta Task 12 (se agregan iconos); el build de vite no falla por íconos ausentes.

- [ ] **Step 8: Commit**

```powershell
git add -A
git commit -m "chore: scaffold polla-app (vite react ts, tailwind, pwa, supabase)"
```

---

## Task 2: Tipos + puntaje (TDD, núcleo)

**Files:**
- Create: `polla-app/src/types.ts`, `polla-app/src/lib/scoring.ts`, `polla-app/src/lib/scoring.test.ts`

- [ ] **Step 1: `src/types.ts`**

```ts
export type Usuario = 'andres' | 'melisa';
export type Fase = 'grupos' | 'eliminacion';
export type Estado = 'programado' | 'en_juego' | 'finalizado';

export interface Partido {
  id: string;
  ext_id: string;
  fase: Fase;
  grupo: string | null;
  fecha_hora: string;            // ISO UTC
  equipo_local: string;
  equipo_visitante: string;
  bandera_local: string | null;
  bandera_visitante: string | null;
  gol_local_real: number | null;
  gol_visitante_real: number | null;
  estado: Estado;
}

export interface Prediccion {
  id: string;
  partido_id: string;
  usuario: Usuario;
  gol_local: number;
  gol_visitante: number;
  updated_at: string;
}

export interface Desglose {
  resultado: number;
  golLocal: number;
  golVisitante: number;
  diferencia: number;
  total: number;
}
```

- [ ] **Step 2: Escribir el test que falla — `src/lib/scoring.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { puntuar } from './scoring';

describe('puntuar', () => {
  it('pred 1:0 real 1:0 en grupos = 10 (todo pleno)', () => {
    expect(puntuar(1, 0, 1, 0, 'grupos').total).toBe(10);
  });
  it('pred 1:0 real 1:0 en eliminacion = 20', () => {
    expect(puntuar(1, 0, 1, 0, 'eliminacion').total).toBe(20);
  });
  it('pred 2:0 real 3:1 en grupos = 6 (resultado 5 + diferencia 1)', () => {
    const d = puntuar(2, 0, 3, 1, 'grupos');
    expect(d).toMatchObject({ resultado: 5, golLocal: 0, golVisitante: 0, diferencia: 1, total: 6 });
  });
  it('pred 2:0 real 3:1 en eliminacion = 12', () => {
    expect(puntuar(2, 0, 3, 1, 'eliminacion').total).toBe(12);
  });
  it('pred 1:1 real 2:2 en grupos = 6 (empate acertado + diferencia 0)', () => {
    expect(puntuar(1, 1, 2, 2, 'grupos').total).toBe(6);
  });
  it('pred 0:2 real 3:1 en grupos = 0 (signo de diferencia opuesto, gana otro)', () => {
    expect(puntuar(0, 2, 3, 1, 'grupos').total).toBe(0);
  });
  it('diferencia exige mismo signo: pred 2:1 real 1:0 = resultado 5 + diferencia 1 = 6', () => {
    expect(puntuar(2, 1, 1, 0, 'grupos').total).toBe(6);
  });
});
```

- [ ] **Step 3: Correr test (debe fallar)**

Run: `npm test`
Expected: FAIL — `puntuar is not a function` / módulo no encontrado.

- [ ] **Step 4: Implementar `src/lib/scoring.ts`**

```ts
import type { Fase, Desglose } from '../types';

const signo = (n: number): -1 | 0 | 1 => (n > 0 ? 1 : n < 0 ? -1 : 0);

/** Puntaje del reglamento. pl/pv = predicho, al/av = real. */
export function puntuar(pl: number, pv: number, al: number, av: number, fase: Fase): Desglose {
  const m = fase === 'eliminacion' ? 2 : 1;
  const resultado = signo(pl - pv) === signo(al - av) ? 5 * m : 0;
  const golLocal = pl === al ? 2 * m : 0;
  const golVisitante = pv === av ? 2 * m : 0;
  const diferencia = pl - pv === al - av ? 1 * m : 0;
  return { resultado, golLocal, golVisitante, diferencia, total: resultado + golLocal + golVisitante + diferencia };
}
```

- [ ] **Step 5: Correr test (debe pasar)**

Run: `npm test`
Expected: PASS (7 tests).

- [ ] **Step 6: Commit**

```powershell
git add -A
git commit -m "feat: tipos y funcion de puntaje del reglamento con tests"
```

---

## Task 3: Bloqueo / revelado / countdown (TDD)

**Files:**
- Create: `polla-app/src/lib/lock.ts`, `polla-app/src/lib/lock.test.ts`

Regla: bloqueo y revelado ocurren ambos en `inicio − 10 min`.

- [ ] **Step 1: Test que falla — `src/lib/lock.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { estaBloqueado, rivalRevelado, msAlCierre, LOCK_MS } from './lock';

const inicio = '2026-06-16T18:00:00Z';

describe('lock', () => {
  it('LOCK_MS son 10 minutos', () => {
    expect(LOCK_MS).toBe(10 * 60 * 1000);
  });
  it('no bloqueado 11 min antes', () => {
    expect(estaBloqueado(inicio, new Date('2026-06-16T17:49:00Z'))).toBe(false);
  });
  it('bloqueado justo a 10 min antes', () => {
    expect(estaBloqueado(inicio, new Date('2026-06-16T17:50:00Z'))).toBe(true);
  });
  it('rival se revela cuando esta bloqueado', () => {
    expect(rivalRevelado(inicio, new Date('2026-06-16T17:50:00Z'))).toBe(true);
    expect(rivalRevelado(inicio, new Date('2026-06-16T17:49:00Z'))).toBe(false);
  });
  it('msAlCierre cuenta hasta inicio-10min', () => {
    expect(msAlCierre(inicio, new Date('2026-06-16T17:49:00Z'))).toBe(60 * 1000);
    expect(msAlCierre(inicio, new Date('2026-06-16T17:55:00Z'))).toBe(0);
  });
});
```

- [ ] **Step 2: Correr (falla)** — Run: `npm test` → FAIL (módulo `lock` no existe).

- [ ] **Step 3: Implementar `src/lib/lock.ts`**

```ts
export const LOCK_MS = 10 * 60 * 1000;

const cierre = (inicioISO: string) => new Date(inicioISO).getTime() - LOCK_MS;

export function estaBloqueado(inicioISO: string, ahora: Date = new Date()): boolean {
  return ahora.getTime() >= cierre(inicioISO);
}

/** El rival se revela en el mismo instante del bloqueo. */
export function rivalRevelado(inicioISO: string, ahora: Date = new Date()): boolean {
  return estaBloqueado(inicioISO, ahora);
}

/** Milisegundos restantes hasta el cierre (0 si ya cerro). */
export function msAlCierre(inicioISO: string, ahora: Date = new Date()): number {
  return Math.max(0, cierre(inicioISO) - ahora.getTime());
}
```

- [ ] **Step 4: Correr (pasa)** — Run: `npm test` → PASS.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: logica de bloqueo, revelado y countdown con tests"
```

---

## Task 4: Tabla de posiciones + desempate (TDD)

**Files:**
- Create: `polla-app/src/lib/standings.ts`, `polla-app/src/lib/standings.test.ts`

Desempate del reglamento: a igualdad de total, gana quien tenga más partidos con
puntaje pleno (10 grupos / 20 elim), luego 7, luego 6, luego 5.

- [ ] **Step 1: Test que falla — `src/lib/standings.test.ts`**

```ts
import { describe, it, expect } from 'vitest';
import { calcularTabla } from './standings';
import type { Partido, Prediccion } from '../types';

const base = {
  ext_id: 'x', grupo: null, fecha_hora: '2026-06-16T18:00:00Z',
  equipo_local: 'A', equipo_visitante: 'B', bandera_local: null, bandera_visitante: null,
  estado: 'finalizado' as const,
};
const p = (id: string, gl: number, gv: number, fase: 'grupos' | 'eliminacion' = 'grupos'): Partido =>
  ({ ...base, id, fase, gol_local_real: gl, gol_visitante_real: gv });
const pred = (partido_id: string, usuario: 'andres' | 'melisa', gl: number, gv: number): Prediccion =>
  ({ id: partido_id + usuario, partido_id, usuario, gol_local: gl, gol_visitante: gv, updated_at: '' });

describe('calcularTabla', () => {
  it('suma puntos por usuario y ordena desc', () => {
    const partidos = [p('1', 1, 0)];
    const preds = [pred('1', 'andres', 1, 0), pred('1', 'melisa', 2, 0)];
    const tabla = calcularTabla(partidos, preds);
    expect(tabla[0].usuario).toBe('andres');   // pleno 10
    expect(tabla[0].total).toBe(10);
    expect(tabla[1].usuario).toBe('melisa');    // resultado 5 + nada mas = 5
    expect(tabla[1].total).toBe(5);
  });
  it('ignora partidos no finalizados', () => {
    const partidos = [{ ...p('1', 1, 0), estado: 'programado' as const }];
    const preds = [pred('1', 'andres', 1, 0)];
    expect(calcularTabla(partidos, preds)[0].total).toBe(0);
  });
  it('desempata por numero de plenos', () => {
    // ambos suman 10, pero andres con un pleno (10) y melisa con dos parciales (5+5)
    const partidos = [p('1', 1, 0), p('2', 2, 2), p('3', 0, 0)];
    const preds = [
      pred('1', 'andres', 1, 0),  // pleno 10
      pred('2', 'melisa', 1, 1),  // empate acertado 5 + dif 1 = 6
      pred('3', 'melisa', 3, 3),  // empate acertado 5 + dif 1 = 6 -> total 12? ajustar
    ];
    const tabla = calcularTabla(partidos, preds);
    expect(tabla.find(r => r.usuario === 'andres')!.plenos).toBe(1);
  });
});
```

- [ ] **Step 2: Correr (falla)** — Run: `npm test` → FAIL.

- [ ] **Step 3: Implementar `src/lib/standings.ts`**

```ts
import type { Partido, Prediccion, Usuario } from '../types';
import { puntuar } from './scoring';

export interface FilaTabla {
  usuario: Usuario;
  total: number;
  plenos: number;   // partidos con puntaje maximo (10 grupos / 20 elim)
  p7: number;
  p6: number;
  p5: number;
}

const USUARIOS: Usuario[] = ['andres', 'melisa'];

export function calcularTabla(partidos: Partido[], predicciones: Prediccion[]): FilaTabla[] {
  const finalizados = partidos.filter(
    p => p.estado === 'finalizado' && p.gol_local_real !== null && p.gol_visitante_real !== null,
  );
  const filas: FilaTabla[] = USUARIOS.map(usuario => {
    let total = 0, plenos = 0, p7 = 0, p6 = 0, p5 = 0;
    for (const partido of finalizados) {
      const pr = predicciones.find(x => x.partido_id === partido.id && x.usuario === usuario);
      if (!pr) continue;
      const d = puntuar(pr.gol_local, pr.gol_visitante, partido.gol_local_real!, partido.gol_visitante_real!, partido.fase);
      total += d.total;
      const max = partido.fase === 'eliminacion' ? 20 : 10;
      if (d.total === max) plenos++;
      else if (d.total === 7) p7++;
      else if (d.total === 6) p6++;
      else if (d.total === 5) p5++;
    }
    return { usuario, total, plenos, p7, p6, p5 };
  });
  return filas.sort((a, b) =>
    b.total - a.total || b.plenos - a.plenos || b.p7 - a.p7 || b.p6 - a.p6 || b.p5 - a.p5,
  );
}
```

- [ ] **Step 4: Correr (pasa)** — Run: `npm test` → PASS.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: tabla de posiciones con desempate por plenos y tests"
```

---

## Task 5: Esquema Supabase (DDL + RLS)

**Files:**
- Create: `polla-app/supabase/schema.sql`

- [ ] **Step 1: Escribir `supabase/schema.sql`**

```sql
-- Tablas de la Polla Mundial 2026 (prefijo polla_)
create table if not exists polla_partidos (
  id uuid primary key default gen_random_uuid(),
  ext_id text unique not null,
  fase text not null check (fase in ('grupos','eliminacion')),
  grupo text,
  fecha_hora timestamptz not null,
  equipo_local text not null,
  equipo_visitante text not null,
  bandera_local text,
  bandera_visitante text,
  gol_local_real int,
  gol_visitante_real int,
  estado text not null default 'programado' check (estado in ('programado','en_juego','finalizado'))
);

create table if not exists polla_predicciones (
  id uuid primary key default gen_random_uuid(),
  partido_id uuid not null references polla_partidos(id) on delete cascade,
  usuario text not null check (usuario in ('andres','melisa')),
  gol_local int not null,
  gol_visitante int not null,
  updated_at timestamptz not null default now(),
  unique (partido_id, usuario)
);

alter table polla_partidos enable row level security;
alter table polla_predicciones enable row level security;

-- App privada detras del gate: anon lee todo
create policy "polla_partidos lectura" on polla_partidos for select to anon using (true);
create policy "polla_predicciones lectura" on polla_predicciones for select to anon using (true);

-- anon puede crear/editar predicciones; el service role (cron) escribe resultados
create policy "polla_predicciones insert" on polla_predicciones for insert to anon with check (true);
create policy "polla_predicciones update" on polla_predicciones for update to anon using (true) with check (true);
```

- [ ] **Step 2: Ejecutar en Supabase**

Abrir el SQL Editor del proyecto `nuestros-viajes`
(https://supabase.com/dashboard → proyecto → SQL Editor), pegar el contenido de
`supabase/schema.sql` y ejecutar. Verificar que las 2 tablas aparecen en Table Editor.

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat: esquema supabase polla_partidos y polla_predicciones con RLS"
```

---

## Task 6: Capa de datos (db.ts)

**Files:**
- Create: `polla-app/src/lib/db.ts`

- [ ] **Step 1: Implementar `src/lib/db.ts`**

```ts
import { supabase } from './supabase';
import type { Partido, Prediccion, Usuario } from '../types';

const DESDE = '2026-06-16T00:00:00Z';

export async function fetchPartidos(): Promise<Partido[]> {
  const { data, error } = await supabase
    .from('polla_partidos')
    .select('*')
    .gte('fecha_hora', DESDE)
    .order('fecha_hora', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Partido[];
}

export async function fetchPredicciones(): Promise<Prediccion[]> {
  const { data, error } = await supabase.from('polla_predicciones').select('*');
  if (error) throw error;
  return (data ?? []) as Prediccion[];
}

/** Crea o actualiza la prediccion del usuario para un partido. */
export async function guardarPrediccion(
  partido_id: string, usuario: Usuario, gol_local: number, gol_visitante: number,
): Promise<Prediccion> {
  const { data, error } = await supabase
    .from('polla_predicciones')
    .upsert({ partido_id, usuario, gol_local, gol_visitante, updated_at: new Date().toISOString() },
            { onConflict: 'partido_id,usuario' })
    .select()
    .single();
  if (error) throw error;
  return data as Prediccion;
}

/** Fallback manual: setear el marcador real desde la app. */
export async function guardarResultadoManual(
  partido_id: string, gol_local_real: number, gol_visitante_real: number,
): Promise<void> {
  const { error } = await supabase
    .from('polla_partidos')
    .update({ gol_local_real, gol_visitante_real, estado: 'finalizado' })
    .eq('id', partido_id);
  if (error) throw error;
}
```

- [ ] **Step 2: Verificar typecheck**

Run: `npm run build`
Expected: compila sin errores de tipo.

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat: capa de datos supabase (partidos, predicciones, resultado manual)"
```

---

## Task 7: Estilo liquid glass + colores de usuario + identidad

**Files:**
- Create/Modify: `polla-app/src/index.css`, `polla-app/src/lib/identity.ts`, `polla-app/src/components/glass/GlassCard.tsx`

- [ ] **Step 1: `src/index.css`** (reemplaza el generado por Vite)

```css
@import "tailwindcss";

@theme {
  --color-bg: #0b0b14;
  --color-bg-2: #141425;
  --color-user-melisa: #a855f7;   /* morado */
  --color-user-andres: #ef4444;   /* rojo */
  --font-display: 'Inter', system-ui, sans-serif;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: var(--font-display);
  color: #f5f5fa;
  background:
    radial-gradient(1200px 600px at 20% -10%, #1e1b4b 0%, transparent 60%),
    radial-gradient(1000px 500px at 90% 10%, #3b0764 0%, transparent 55%),
    var(--color-bg);
  min-height: 100svh;
  -webkit-font-smoothing: antialiased;
}

#root { min-height: 100svh; }

/* --- Liquid glass --- */
.glass {
  background: rgba(255, 255, 255, 0.07);
  backdrop-filter: blur(18px) saturate(140%);
  -webkit-backdrop-filter: blur(18px) saturate(140%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.18);
}
.glass-card { border-radius: 1.25rem; }

.user-melisa { color: var(--color-user-melisa); }
.user-andres { color: var(--color-user-andres); }
.ring-melisa { box-shadow: 0 0 0 2px var(--color-user-melisa); }
.ring-andres { box-shadow: 0 0 0 2px var(--color-user-andres); }

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; }
}
```

- [ ] **Step 2: `src/lib/identity.ts`** (adaptado de viajes-app)

```ts
import type { Usuario } from '../types';

const KEY = 'polla-mundial:usuario';

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function checkAccessCode(code: string): Promise<boolean> {
  return (await sha256Hex(code.trim().toLowerCase())) === import.meta.env.VITE_ACCESS_CODE_HASH;
}

export function getStoredUsuario(): Usuario | null {
  const v = localStorage.getItem(KEY);
  return v === 'andres' || v === 'melisa' ? v : null;
}

export function storeUsuario(u: Usuario): void {
  localStorage.setItem(KEY, u);
}

export const USER_COLOR: Record<Usuario, string> = {
  andres: 'var(--color-user-andres)',
  melisa: 'var(--color-user-melisa)',
};
export const USER_NOMBRE: Record<Usuario, string> = { andres: 'Andrés', melisa: 'Melisa' };
```

- [ ] **Step 3: `src/components/glass/GlassCard.tsx`**

```tsx
import type { ReactNode } from 'react';

export default function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`glass glass-card ${className}`}>{children}</div>;
}
```

- [ ] **Step 4: Verificar build**

Run: `npm run build` → compila.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: estilo liquid glass, colores melisa morado / andres rojo, identidad"
```

---

## Task 8: AccessGate (código + elegir usuario)

**Files:**
- Create: `polla-app/src/components/gate/AccessGate.tsx`

- [ ] **Step 1: `src/components/gate/AccessGate.tsx`**

```tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Trophy } from 'lucide-react';
import { checkAccessCode, storeUsuario, USER_COLOR, USER_NOMBRE } from '../../lib/identity';
import type { Usuario } from '../../types';

export default function AccessGate({ onUnlocked }: { onUnlocked: (u: Usuario) => void }) {
  const [step, setStep] = useState<'code' | 'who'>('code');
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  async function submit() {
    if (!code.trim() || checking) return;
    setChecking(true);
    const ok = await checkAccessCode(code);
    setChecking(false);
    if (ok) { setError(false); setStep('who'); } else setError(true);
  }

  function pick(u: Usuario) { storeUsuario(u); onUnlocked(u); }

  return (
    <div className="min-h-svh flex flex-col items-center justify-center px-6">
      <AnimatePresence mode="wait">
        {step === 'code' ? (
          <motion.div key="code" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }} className="glass glass-card w-full max-w-sm text-center p-8">
            <Trophy className="w-10 h-10 mx-auto mb-3" aria-hidden />
            <h1 className="font-bold text-2xl">Polla Mundial 2026</h1>
            <p className="opacity-70 mt-1 mb-6">Solo nosotros dos</p>
            <motion.input
              animate={error ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
              type="password" value={code} onChange={e => setCode(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Código secreto"
              className="w-full rounded-xl bg-white/10 border border-white/20 px-4 py-3 text-center outline-none" />
            {error && <p className="text-red-400 text-sm mt-2">Código incorrecto</p>}
            <button onClick={submit} disabled={checking}
              className="glass mt-5 w-full rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
              <Lock className="w-4 h-4" aria-hidden /> Entrar
            </button>
          </motion.div>
        ) : (
          <motion.div key="who" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm text-center">
            <h2 className="font-bold text-xl mb-5">¿Quién eres?</h2>
            <div className="grid grid-cols-2 gap-4">
              {(['melisa', 'andres'] as Usuario[]).map(u => (
                <button key={u} onClick={() => pick(u)}
                  className="glass glass-card py-8 font-semibold text-lg"
                  style={{ boxShadow: `0 0 0 2px ${USER_COLOR[u]}` }}>
                  <span style={{ color: USER_COLOR[u] }}>{USER_NOMBRE[u]}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

- [ ] **Step 2: Verificar build** — Run: `npm run build` → compila.

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat: AccessGate con codigo y seleccion de usuario"
```

---

## Task 9: Stepper de goles + tarjeta de predicción

**Files:**
- Create: `polla-app/src/components/partido/ScoreInput.tsx`, `polla-app/src/components/partido/PredictionCard.tsx`

- [ ] **Step 1: `src/components/partido/ScoreInput.tsx`**

```tsx
import { Minus, Plus } from 'lucide-react';

export default function ScoreInput({ value, onChange, disabled, color }:
  { value: number; onChange: (n: number) => void; disabled?: boolean; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <button aria-label="menos" disabled={disabled || value <= 0}
        onClick={() => onChange(value - 1)}
        className="glass w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30">
        <Minus className="w-4 h-4" />
      </button>
      <span className="w-8 text-center text-2xl font-bold tabular-nums" style={{ color }}>{value}</span>
      <button aria-label="mas" disabled={disabled}
        onClick={() => onChange(value + 1)}
        className="glass w-8 h-8 rounded-full flex items-center justify-center disabled:opacity-30">
        <Plus className="w-4 h-4" />
      </button>
    </div>
  );
}
```

- [ ] **Step 2: `src/components/partido/PredictionCard.tsx`**

```tsx
import { useState } from 'react';
import { Lock } from 'lucide-react';
import GlassCard from '../glass/GlassCard';
import ScoreInput from './ScoreInput';
import { estaBloqueado, msAlCierre } from '../../lib/lock';
import { USER_COLOR } from '../../lib/identity';
import { guardarPrediccion } from '../../lib/db';
import type { Partido, Prediccion, Usuario } from '../../types';

function fmtCuenta(ms: number): string {
  const m = Math.floor(ms / 60000), h = Math.floor(m / 60);
  if (h > 24) return `cierra en ${Math.floor(h / 24)}d`;
  if (h > 0) return `cierra en ${h}h ${m % 60}m`;
  return `cierra en ${m}m`;
}

export default function PredictionCard({ partido, miPrediccion, usuario, onSaved }:
  { partido: Partido; miPrediccion?: Prediccion; usuario: Usuario; onSaved: (p: Prediccion) => void }) {
  const [gl, setGl] = useState(miPrediccion?.gol_local ?? 0);
  const [gv, setGv] = useState(miPrediccion?.gol_visitante ?? 0);
  const [guardando, setGuardando] = useState(false);
  const bloqueado = estaBloqueado(partido.fecha_hora);
  const color = USER_COLOR[usuario];

  async function guardar() {
    if (bloqueado || guardando) return;
    setGuardando(true);
    try { onSaved(await guardarPrediccion(partido.id, usuario, gl, gv)); }
    finally { setGuardando(false); }
  }

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between text-sm opacity-70 mb-3">
        <span>{partido.grupo ? `Grupo ${partido.grupo}` : 'Eliminación'}</span>
        <span className="flex items-center gap-1">
          {bloqueado ? <><Lock className="w-3 h-3" /> cerrado</> : fmtCuenta(msAlCierre(partido.fecha_hora))}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="flex-1 text-right font-semibold">{partido.equipo_local}</span>
        <ScoreInput value={gl} onChange={setGl} disabled={bloqueado} color={color} />
        <span className="opacity-50">:</span>
        <ScoreInput value={gv} onChange={setGv} disabled={bloqueado} color={color} />
        <span className="flex-1 font-semibold">{partido.equipo_visitante}</span>
      </div>
      {!bloqueado && (
        <button onClick={guardar} disabled={guardando}
          className="glass mt-4 w-full rounded-xl py-2 font-semibold"
          style={{ boxShadow: `0 0 0 1.5px ${color}` }}>
          {guardando ? 'Guardando…' : miPrediccion ? 'Actualizar' : 'Guardar predicción'}
        </button>
      )}
    </GlassCard>
  );
}
```

- [ ] **Step 3: Verificar build** — Run: `npm run build` → compila.

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "feat: stepper de goles y tarjeta de prediccion con bloqueo"
```

---

## Task 10: Detalle de partido (revelado + desglose)

**Files:**
- Create: `polla-app/src/components/partido/MatchDetail.tsx`

- [ ] **Step 1: `src/components/partido/MatchDetail.tsx`**

```tsx
import GlassCard from '../glass/GlassCard';
import { rivalRevelado } from '../../lib/lock';
import { puntuar } from '../../lib/scoring';
import { USER_COLOR, USER_NOMBRE } from '../../lib/identity';
import type { Partido, Prediccion, Usuario } from '../../types';

const OTRO: Record<Usuario, Usuario> = { andres: 'melisa', melisa: 'andres' };

function FilaDesglose({ p, partido, usuario }:
  { p?: Prediccion; partido: Partido; usuario: Usuario }) {
  const color = USER_COLOR[usuario];
  if (!p) return <p className="opacity-50 text-sm">{USER_NOMBRE[usuario]} no predijo</p>;
  const finalizado = partido.gol_local_real !== null && partido.gol_visitante_real !== null;
  const d = finalizado
    ? puntuar(p.gol_local, p.gol_visitante, partido.gol_local_real!, partido.gol_visitante_real!, partido.fase)
    : null;
  return (
    <div className="flex items-center justify-between py-1">
      <span style={{ color }} className="font-semibold">{USER_NOMBRE[usuario]}</span>
      <span className="tabular-nums">{p.gol_local} : {p.gol_visitante}</span>
      {d && (
        <span className="text-sm opacity-80">
          {d.total} pts ({d.resultado}+{d.golLocal}+{d.golVisitante}+{d.diferencia})
        </span>
      )}
    </div>
  );
}

export default function MatchDetail({ partido, predicciones, usuario }:
  { partido: Partido; predicciones: Prediccion[]; usuario: Usuario }) {
  const mia = predicciones.find(p => p.partido_id === partido.id && p.usuario === usuario);
  const delOtro = predicciones.find(p => p.partido_id === partido.id && p.usuario === OTRO[usuario]);
  const revelado = rivalRevelado(partido.fecha_hora);
  const finalizado = partido.estado === 'finalizado';

  return (
    <GlassCard className="p-4">
      <div className="text-center mb-3">
        <div className="font-semibold">{partido.equipo_local} vs {partido.equipo_visitante}</div>
        {finalizado
          ? <div className="text-2xl font-bold tabular-nums">{partido.gol_local_real} : {partido.gol_visitante_real}</div>
          : <div className="opacity-60 text-sm">{new Date(partido.fecha_hora).toLocaleString('es-CO')}</div>}
      </div>
      <FilaDesglose p={mia} partido={partido} usuario={usuario} />
      {revelado
        ? <FilaDesglose p={delOtro} partido={partido} usuario={OTRO[usuario]} />
        : <p className="opacity-50 text-sm py-1">Predicción de {USER_NOMBRE[OTRO[usuario]]} oculta hasta el cierre</p>}
    </GlassCard>
  );
}
```

- [ ] **Step 2: Verificar build** — Run: `npm run build` → compila.

- [ ] **Step 3: Commit**

```powershell
git add -A
git commit -m "feat: detalle de partido con revelado del rival y desglose de puntos"
```

---

## Task 11: Vistas (Hoy, Fixtures, Tabla) + Shell + App

**Files:**
- Create: `polla-app/src/components/views/TodayView.tsx`, `FixturesView.tsx`, `StandingsView.tsx`, `polla-app/src/components/shell/Shell.tsx`
- Modify: `polla-app/src/App.tsx`

- [ ] **Step 1: `src/components/views/FixturesView.tsx`**

```tsx
import PredictionCard from '../partido/PredictionCard';
import MatchDetail from '../partido/MatchDetail';
import { estaBloqueado } from '../../lib/lock';
import type { Partido, Prediccion, Usuario } from '../../types';

export default function FixturesView({ partidos, predicciones, usuario, onSaved }:
  { partidos: Partido[]; predicciones: Prediccion[]; usuario: Usuario; onSaved: (p: Prediccion) => void }) {
  return (
    <div className="flex flex-col gap-4 pb-24">
      {partidos.map(partido => {
        const mia = predicciones.find(p => p.partido_id === partido.id && p.usuario === usuario);
        return estaBloqueado(partido.fecha_hora)
          ? <MatchDetail key={partido.id} partido={partido} predicciones={predicciones} usuario={usuario} />
          : <PredictionCard key={partido.id} partido={partido} miPrediccion={mia} usuario={usuario} onSaved={onSaved} />;
      })}
    </div>
  );
}
```

- [ ] **Step 2: `src/components/views/TodayView.tsx`**

```tsx
import FixturesView from './FixturesView';
import type { Partido, Prediccion, Usuario } from '../../types';

function esHoy(iso: string): boolean {
  const d = new Date(iso), n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export default function TodayView(props:
  { partidos: Partido[]; predicciones: Prediccion[]; usuario: Usuario; onSaved: (p: Prediccion) => void }) {
  const hoy = props.partidos.filter(p => esHoy(p.fecha_hora));
  if (hoy.length === 0)
    return <p className="opacity-60 text-center py-16">No hay partidos hoy. Revisa Fixtures.</p>;
  return <FixturesView {...props} partidos={hoy} />;
}
```

- [ ] **Step 3: `src/components/views/StandingsView.tsx`**

```tsx
import GlassCard from '../glass/GlassCard';
import { calcularTabla } from '../../lib/standings';
import { USER_COLOR, USER_NOMBRE } from '../../lib/identity';
import type { Partido, Prediccion } from '../../types';

export default function StandingsView({ partidos, predicciones }:
  { partidos: Partido[]; predicciones: Prediccion[] }) {
  const tabla = calcularTabla(partidos, predicciones);
  return (
    <div className="flex flex-col gap-3 pb-24">
      {tabla.map((f, i) => (
        <GlassCard key={f.usuario} className="p-4 flex items-center justify-between"
          style={{ boxShadow: `0 0 0 1.5px ${USER_COLOR[f.usuario]}` }}>
          <span className="flex items-center gap-3">
            <span className="text-lg opacity-60">{i + 1}</span>
            <span className="font-semibold" style={{ color: USER_COLOR[f.usuario] }}>{USER_NOMBRE[f.usuario]}</span>
          </span>
          <span className="text-right">
            <span className="text-2xl font-bold">{f.total}</span>
            <span className="block text-xs opacity-60">{f.plenos} plenos</span>
          </span>
        </GlassCard>
      ))}
    </div>
  );
}
```

Nota: `GlassCard` debe aceptar `style`. Ampliar su firma:

```tsx
// src/components/glass/GlassCard.tsx
import type { CSSProperties, ReactNode } from 'react';
export default function GlassCard({ children, className = '', style }:
  { children: ReactNode; className?: string; style?: CSSProperties }) {
  return <div className={`glass glass-card ${className}`} style={style}>{children}</div>;
}
```

- [ ] **Step 4: `src/components/shell/Shell.tsx`**

```tsx
import { useState } from 'react';
import { CalendarDays, ListChecks, Trophy } from 'lucide-react';
import TodayView from '../views/TodayView';
import FixturesView from '../views/FixturesView';
import StandingsView from '../views/StandingsView';
import { USER_COLOR, USER_NOMBRE } from '../../lib/identity';
import type { Partido, Prediccion, Usuario } from '../../types';

type Tab = 'hoy' | 'fixtures' | 'tabla';

export default function Shell({ usuario, partidos, predicciones, onSaved }:
  { usuario: Usuario; partidos: Partido[]; predicciones: Prediccion[]; onSaved: (p: Prediccion) => void }) {
  const [tab, setTab] = useState<Tab>('hoy');
  const tabs: { id: Tab; label: string; icon: typeof Trophy }[] = [
    { id: 'hoy', label: 'Hoy', icon: CalendarDays },
    { id: 'fixtures', label: 'Fixtures', icon: ListChecks },
    { id: 'tabla', label: 'Tabla', icon: Trophy },
  ];
  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      <header className="flex items-center justify-between mb-5">
        <h1 className="font-bold text-xl">Polla Mundial 2026</h1>
        <span className="text-sm font-semibold" style={{ color: USER_COLOR[usuario] }}>{USER_NOMBRE[usuario]}</span>
      </header>
      {tab === 'hoy' && <TodayView usuario={usuario} partidos={partidos} predicciones={predicciones} onSaved={onSaved} />}
      {tab === 'fixtures' && <FixturesView usuario={usuario} partidos={partidos} predicciones={predicciones} onSaved={onSaved} />}
      {tab === 'tabla' && <StandingsView partidos={partidos} predicciones={predicciones} />}

      <nav className="fixed bottom-0 inset-x-0 glass border-t border-white/10 flex justify-around py-2">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 px-4 py-1 ${tab === t.id ? 'opacity-100' : 'opacity-50'}`}>
            <t.icon className="w-5 h-5" /><span className="text-xs">{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
```

- [ ] **Step 5: `src/App.tsx`**

```tsx
import { useEffect, useState } from 'react';
import AccessGate from './components/gate/AccessGate';
import Shell from './components/shell/Shell';
import { getStoredUsuario } from './lib/identity';
import { fetchPartidos, fetchPredicciones } from './lib/db';
import type { Partido, Prediccion, Usuario } from './types';

export default function App() {
  const [usuario, setUsuario] = useState<Usuario | null>(getStoredUsuario());
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [predicciones, setPredicciones] = useState<Prediccion[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!usuario) return;
    Promise.all([fetchPartidos(), fetchPredicciones()])
      .then(([pa, pr]) => { setPartidos(pa); setPredicciones(pr); })
      .finally(() => setCargando(false));
  }, [usuario]);

  function onSaved(p: Prediccion) {
    setPredicciones(prev => {
      const otras = prev.filter(x => !(x.partido_id === p.partido_id && x.usuario === p.usuario));
      return [...otras, p];
    });
  }

  if (!usuario) return <AccessGate onUnlocked={setUsuario} />;
  if (cargando) return <p className="text-center py-20 opacity-60">Cargando…</p>;
  return <Shell usuario={usuario} partidos={partidos} predicciones={predicciones} onSaved={onSaved} />;
}
```

- [ ] **Step 6: Verificar build** — Run: `npm run build` → compila.

- [ ] **Step 7: Commit**

```powershell
git add -A
git commit -m "feat: vistas hoy/fixtures/tabla, shell con tabs y App con carga de datos"
```

---

## Task 12: Seed de fixtures + iconos PWA (Ideogram)

**Files:**
- Create: `polla-app/scripts/seed-partidos.mjs`, iconos en `polla-app/public/`

- [ ] **Step 1: `scripts/seed-partidos.mjs`** (jala el fixture del Mundial una vez)

```js
// Pobla polla_partidos desde football-data.org. Uso:
//   FOOTBALL_DATA_TOKEN=xxx SUPABASE_URL=xxx SUPABASE_SERVICE_KEY=xxx node scripts/seed-partidos.mjs
import { createClient } from '@supabase/supabase-js';

const { FOOTBALL_DATA_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const faseDe = (stage) => (stage === 'GROUP_STAGE' ? 'grupos' : 'eliminacion');
const estadoDe = (s) => (s === 'FINISHED' ? 'finalizado' : (s === 'IN_PLAY' || s === 'PAUSED') ? 'en_juego' : 'programado');

const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
  headers: { 'X-Auth-Token': FOOTBALL_DATA_TOKEN },
});
if (!res.ok) { console.error('API error', res.status, await res.text()); process.exit(1); }
const { matches } = await res.json();

const filas = matches
  .filter(m => new Date(m.utcDate) >= new Date('2026-06-16T00:00:00Z'))
  .map(m => ({
    ext_id: String(m.id),
    fase: faseDe(m.stage),
    grupo: m.group ? m.group.replace('GROUP_', '') : null,
    fecha_hora: m.utcDate,
    equipo_local: m.homeTeam?.name ?? 'Por definir',
    equipo_visitante: m.awayTeam?.name ?? 'Por definir',
    bandera_local: m.homeTeam?.crest ?? null,
    bandera_visitante: m.awayTeam?.crest ?? null,
    gol_local_real: m.score?.fullTime?.home ?? null,
    gol_visitante_real: m.score?.fullTime?.away ?? null,
    estado: estadoDe(m.status),
  }));

const { error } = await supabase.from('polla_partidos').upsert(filas, { onConflict: 'ext_id' });
if (error) { console.error(error); process.exit(1); }
console.log(`Seed OK: ${filas.length} partidos`);
```

- [ ] **Step 2: Conseguir token football-data.org**

Registrarse gratis en https://www.football-data.org/client/register → copiar el
API token. Guardar para los secrets (Task 13).

- [ ] **Step 3: Correr el seed local**

Run (PowerShell):
```powershell
$env:FOOTBALL_DATA_TOKEN="<token>"
$env:SUPABASE_URL="https://gbfxpzsblnrasfvxnquk.supabase.co"
$env:SUPABASE_SERVICE_KEY="<service_role_key del dashboard: Settings > API>"
node scripts/seed-partidos.mjs
```
Expected: `Seed OK: N partidos`. Verificar filas en Supabase Table Editor.
Si la API no expone aún el Mundial 2026 en el free tier: insertar a mano unos
partidos de prueba en Table Editor y seguir; la app no depende del seed para
compilar.

- [ ] **Step 4: Generar iconos PWA con Ideogram**

Run (usar el patrón `tools/ideogram_gen.py` del repo AltaComediaWeb si está
disponible; si no, generar un icono cuadrado temático "trofeo Mundial liquid
glass, fondo morado/rojo"). Exportar a `public/pwa-192x192.png`,
`public/pwa-512x512.png`, `public/pwa-maskable-512x512.png`. Placeholder válido:
copiar un PNG cuadrado cualquiera con esos nombres para no romper el manifest.

- [ ] **Step 5: Commit**

```powershell
git add -A
git commit -m "feat: script seed de fixtures e iconos PWA"
```

---

## Task 13: Cron de resultados + workflows

**Files:**
- Create: `polla-app/scripts/sync-resultados.mjs`, `polla-app/.github/workflows/sync.yml`, `polla-app/.github/workflows/deploy.yml`

- [ ] **Step 1: `scripts/sync-resultados.mjs`** (mismo mapeo que el seed; reusa upsert por ext_id)

```js
// Actualiza marcadores reales. Mismo endpoint y mapeo que el seed.
import { createClient } from '@supabase/supabase-js';

const { FOOTBALL_DATA_TOKEN, SUPABASE_URL, SUPABASE_SERVICE_KEY } = process.env;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const faseDe = (stage) => (stage === 'GROUP_STAGE' ? 'grupos' : 'eliminacion');
const estadoDe = (s) => (s === 'FINISHED' ? 'finalizado' : (s === 'IN_PLAY' || s === 'PAUSED') ? 'en_juego' : 'programado');

const res = await fetch('https://api.football-data.org/v4/competitions/WC/matches', {
  headers: { 'X-Auth-Token': FOOTBALL_DATA_TOKEN },
});
if (!res.ok) { console.error('API error', res.status); process.exit(1); }
const { matches } = await res.json();

const filas = matches
  .filter(m => new Date(m.utcDate) >= new Date('2026-06-16T00:00:00Z'))
  .map(m => ({
    ext_id: String(m.id),
    fase: faseDe(m.stage),
    grupo: m.group ? m.group.replace('GROUP_', '') : null,
    fecha_hora: m.utcDate,
    equipo_local: m.homeTeam?.name ?? 'Por definir',
    equipo_visitante: m.awayTeam?.name ?? 'Por definir',
    bandera_local: m.homeTeam?.crest ?? null,
    bandera_visitante: m.awayTeam?.crest ?? null,
    gol_local_real: m.score?.fullTime?.home ?? null,
    gol_visitante_real: m.score?.fullTime?.away ?? null,
    estado: estadoDe(m.status),
  }));

const { error } = await supabase.from('polla_partidos').upsert(filas, { onConflict: 'ext_id' });
if (error) { console.error(error); process.exit(1); }
console.log(`Sync OK: ${filas.length} partidos`);
```

- [ ] **Step 2: `.github/workflows/sync.yml`**

```yaml
name: Sync resultados Mundial
on:
  schedule:
    - cron: '0 */2 * * *'
  workflow_dispatch:
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install @supabase/supabase-js
        working-directory: polla-app
      - run: node scripts/sync-resultados.mjs
        working-directory: polla-app
        env:
          FOOTBALL_DATA_TOKEN: ${{ secrets.FOOTBALL_DATA_TOKEN }}
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_KEY: ${{ secrets.SUPABASE_SERVICE_KEY }}
```

- [ ] **Step 3: `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
concurrency:
  group: pages
  cancel-in-progress: false
jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: polla-app
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm, cache-dependency-path: polla-app/package-lock.json }
      - run: npm install
      - run: npm run build
        env:
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          VITE_ACCESS_CODE_HASH: ${{ secrets.ACCESS_CODE_HASH }}
      - uses: actions/upload-pages-artifact@v3
        with: { path: polla-app/dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Commit**

```powershell
git add -A
git commit -m "feat: cron de resultados y workflows de deploy/sync"
```

---

## Task 14: Repo GitHub, secrets, deploy y verificación final

**Files:** ninguno nuevo — configuración.

- [ ] **Step 1: Crear repo y push**

Run (desde la raíz del repo `Polla_Mundial`, que ya es git):
```powershell
gh repo create polla-app --private --source . --remote origin --push
```
(O crear el repo en github.com y `git remote add origin … ; git push -u origin main`.)
Nota: el `base` de Vite es `/polla-app/` → el repo DEBE llamarse `polla-app`. Si
usas otro nombre, ajustar `base` en `vite.config.ts` y `start_url`/`scope` del manifest.

- [ ] **Step 2: Cargar secrets del repo**

Run:
```powershell
gh secret set SUPABASE_URL --body "https://gbfxpzsblnrasfvxnquk.supabase.co"
gh secret set SUPABASE_ANON_KEY --body "sb_publishable_mRvhm4a-U8F9NqBNe4fNiQ_q_0cYLiD"
gh secret set ACCESS_CODE_HASH --body "<hash del Task 1 Step 5>"
gh secret set FOOTBALL_DATA_TOKEN --body "<token football-data.org>"
gh secret set SUPABASE_SERVICE_KEY --body "<service_role_key>"
```

- [ ] **Step 3: Activar GitHub Pages**

En el repo: Settings → Pages → Source = **GitHub Actions**. El push ya disparó
`deploy.yml`; esperar a que termine en Actions.

- [ ] **Step 4: Correr el sync una vez a mano**

En Actions → "Sync resultados Mundial" → Run workflow. Verificar que termina en
verde y que actualiza marcadores en Supabase.

- [ ] **Step 5: Verificación funcional (manual)**

Abrir `https://<usuario>.github.io/polla-app/` en el celular:
1. Entrar con el código → elegir Melisa (morado) / Andrés (rojo).
2. En Fixtures, predecir un partido futuro y guardar. Recargar: la predicción persiste.
3. Confirmar que un partido a <10 min aparece **cerrado** y revela al rival.
4. En un partido finalizado, ver el desglose de puntos.
5. En Tabla, ver el total y los plenos por usuario.
6. Instalar la PWA ("Agregar a inicio").

- [ ] **Step 6: README + commit final**

Crear `polla-app/README.md` con: descripción, stack, cómo correr (`npm run dev`),
cómo desplegar (push a `main`), variables de entorno, y los 5 secrets requeridos.
```powershell
git add -A
git commit -m "docs: readme polla-app"
git push
```

---

## Self-Review (cobertura del spec)

- §2 Stack → Task 1 ✓
- §3 Arquitectura (Pages + Supabase + cron) → Tasks 1, 6, 13 ✓
- §4 Modelo de datos → Task 5 (DDL/RLS) ✓
- §5 Puntaje → Task 2 (TDD, casos del reglamento) ✓
- §6 Tabla + desempate → Task 4 ✓
- §7 Pantallas (gate, hoy, fixtures, detalle, posiciones) → Tasks 8, 10, 11 ✓
- §7 Liquid glass + colores usuario → Task 7 ✓
- §8 Bloqueo + revelado (inicio−10min) → Task 3 (lógica) + Tasks 9/10 (UI) ✓
- §8 Filtro fecha ≥ 2026-06-16 → Task 6 (`db.ts`) + scripts (Task 12/13) ✓
- §9 Sync resultados (seed + cron + fallback manual) → Tasks 12, 13 (+ `guardarResultadoManual` en Task 6) ✓
- §10 Fase 1 completa; Fase 2 (recordatorio PWA, especiales) fuera de alcance ✓

Tipos consistentes: `puntuar`, `calcularTabla`, `estaBloqueado`/`rivalRevelado`/`msAlCierre`,
`guardarPrediccion`/`fetchPartidos`/`fetchPredicciones`, `USER_COLOR`/`USER_NOMBRE` usados igual en todas las tasks.
