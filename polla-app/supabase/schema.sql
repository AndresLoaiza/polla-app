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
