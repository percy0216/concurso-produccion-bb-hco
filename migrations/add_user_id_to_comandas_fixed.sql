-- =========================================================
-- MIGRACIÓN CORREGIDA: Agregar ownership a comandas (user_id)
-- Fix: infinite recursion en policy perfiles usando auth.jwt()
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =========================================================

-- 1. Agregar columna user_id (nullable primero para datos existentes)
alter table public.comandas 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2. Para datos existentes, asignar al primer admin/supervisor disponible
update public.comandas 
set user_id = (
  select id from public.perfiles 
  where rol in ('admin', 'supervisor') 
  limit 1
)
where user_id is null;

-- 3. Hacerla NOT NULL
alter table public.comandas 
alter column user_id set not null;

-- 4. Índice para performance
create index if not exists idx_comandas_user_id on public.comandas(user_id);

-- 5. =========================================================
--    POLÍTICAS CORREGIDAS (sin infinite recursion)
-- =========================================================

-- PERFILES: Eliminar policy antigua que causaba recursión
drop policy if exists "perfiles_select_propio_o_admin" on public.perfiles;

-- Nueva policy: usa auth.jwt() -> user_metadata.rol en lugar de consultar la tabla
create policy "perfiles_select_propio_o_admin"
  on public.perfiles for select
  using (
    auth.uid() = id 
    or (auth.jwt() ->> 'user_metadata')::jsonb ->> 'rol' in ('supervisor','admin')
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- OPERADORES: Sin cambios (no causa recursión)
drop policy if exists "operadores_select_autenticados" on public.operadores;
drop policy if exists "operadores_write_supervisor_admin" on public.operadores;

create policy "operadores_select_autenticados"
  on public.operadores for select
  using (auth.role() = 'authenticated');

create policy "operadores_write_supervisor_admin"
  on public.operadores for all
  using (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'rol' in ('supervisor','admin')
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- COMANDAS: Ownership basado en user_id
drop policy if exists "comandas_select_autenticados" on public.comandas;
drop policy if exists "comandas_insert_autenticados" on public.comandas;
drop policy if exists "comandas_update_delete_supervisor_admin" on public.comandas;
drop policy if exists "comandas_delete_supervisor_admin" on public.comandas;

-- SELECT: usuario ve sus comandas; admin/supervisor ve todas
create policy "comandas_select_own_or_admin"
  on public.comandas for select
  using (
    user_id = auth.uid() 
    or (auth.jwt() ->> 'user_metadata')::jsonb ->> 'rol' in ('supervisor','admin')
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- INSERT: usuario autenticado crea con su user_id
create policy "comandas_insert_own"
  on public.comandas for insert
  with check (user_id = auth.uid());

-- UPDATE: dueño o admin/supervisor
create policy "comandas_update_own_or_admin"
  on public.comandas for update
  using (
    user_id = auth.uid() 
    or (auth.jwt() ->> 'user_metadata')::jsonb ->> 'rol' in ('supervisor','admin')
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  )
  with check (
    user_id = auth.uid() 
    or (auth.jwt() ->> 'user_metadata')::jsonb ->> 'rol' in ('supervisor','admin')
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- DELETE: solo admin/supervisor
create policy "comandas_delete_admin"
  on public.comandas for delete
  using (
    (auth.jwt() ->> 'user_metadata')::jsonb ->> 'rol' in ('supervisor','admin')
    or (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  );

-- 6. Actualizar vista para incluir user_id
create or replace view public.vista_resultados as
select
  id_orden,
  grupo,
  turno,
  cod_oper_pl,
  tiempo_plancha,
  cod_oper_pk,
  tiempo_packer,
  tiempo_despacho,
  cumple_meta,
  fase,
  created_at,
  user_id
from public.comandas;

-- 7. Realtime: no necesita cambios, el filtro se hace via RLS
alter publication supabase_realtime add table public.comandas;