-- =========================================================
-- MIGRACIÓN: Agregar ownership a comandas (user_id)
-- Ejecutar en Supabase Dashboard → SQL Editor
-- =========================================================

-- 1. Agregar columna user_id (nullable primero para datos existentes)
alter table public.comandas 
add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2. Para datos existentes, asignar al primer admin/supervisor disponible
-- (ajusta según tu caso; si no hay datos, puedes saltar este paso)
update public.comandas 
set user_id = (
  select id from public.perfiles 
  where rol in ('admin', 'supervisor') 
  limit 1
)
where user_id is null;

-- 3. Hacerla NOT NULL (después de poblar datos existentes)
alter table public.comandas 
alter column user_id set not null;

-- 4. Índice para performance
create index if not exists idx_comandas_user_id on public.comandas(user_id);

-- 5. Actualizar RLS POLICIES
-- Eliminar policies antiguas
drop policy if exists "comandas_select_autenticados" on public.comandas;
drop policy if exists "comandas_insert_autenticados" on public.comandas;
drop policy if exists "comandas_update_delete_supervisor_admin" on public.comandas;
drop policy if exists "comandas_delete_supervisor_admin" on public.comandas;

-- Nuevas policies con ownership
-- SELECT: usuarios ven solo sus comandas; supervisor/admin ven todas
create policy "comandas_select_own_or_admin"
  on public.comandas for select
  using (
    user_id = auth.uid() 
    or exists (
      select 1 from public.perfiles p 
      where p.id = auth.uid() and p.rol in ('supervisor','admin')
    )
  );

-- INSERT: usuario autenticado crea con su user_id
create policy "comandas_insert_own"
  on public.comandas for insert
  with check (user_id = auth.uid());

-- UPDATE: dueño o supervisor/admin
create policy "comandas_update_own_or_admin"
  on public.comandas for update
  using (
    user_id = auth.uid() 
    or exists (
      select 1 from public.perfiles p 
      where p.id = auth.uid() and p.rol in ('supervisor','admin')
    )
  )
  with check (
    user_id = auth.uid() 
    or exists (
      select 1 from public.perfiles p 
      where p.id = auth.uid() and p.rol in ('supervisor','admin')
    )
  );

-- DELETE: solo supervisor/admin (o dueño si lo permites)
create policy "comandas_delete_admin"
  on public.comandas for delete
  using (
    exists (
      select 1 from public.perfiles p 
      where p.id = auth.uid() and p.rol in ('supervisor','admin')
    )
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

-- 7. Realtime: no necesita cambios, el filtro se hace en el cliente
-- (la policy de SELECT ya filtra lo que cada usuario recibe)