'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Operador, AreaOperador, RolUsuario } from '@/types/database'

export interface OperadorInput {
  cod_operador: string;
  area: AreaOperador;
  activo?: boolean;
  fecha_pretest?: string | null;
  fecha_postest?: string | null;
}

export async function getOperadores(): Promise<{ data: Operador[] | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('operadores')
    .select('*')
    .order('cod_operador', { ascending: true })
  
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function getOperadoresByArea(area: AreaOperador): Promise<{ data: Operador[] | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('operadores')
    .select('*')
    .eq('area', area)
    .eq('activo', true)
    .order('cod_operador', { ascending: true })
  
  if (error) return { data: null, error: error.message }
  return { data, error: null }
}

export async function createOperador(input: OperadorInput): Promise<{ data: Operador | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('operadores')
    .insert({
      cod_operador: input.cod_operador,
      area: input.area,
      activo: input.activo ?? true,
      fecha_pretest: input.fecha_pretest ?? null,
      fecha_postest: input.fecha_postest ?? null,
    })
    .select()
    .single()
  
  if (error) return { data: null, error: error.message }
  
  revalidatePath('/', 'layout')
  return { data, error: null }
}

export async function updateOperador(cod_operador: string, input: Partial<OperadorInput>): Promise<{ data: Operador | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('operadores')
    .update({
      area: input.area,
      activo: input.activo,
      fecha_pretest: input.fecha_pretest,
      fecha_postest: input.fecha_postest,
    })
    .eq('cod_operador', cod_operador)
    .select()
    .single()
  
  if (error) return { data: null, error: error.message }
  
  revalidatePath('/', 'layout')
  return { data, error: null }
}

export async function deleteOperador(cod_operador: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('operadores')
    .delete()
    .eq('cod_operador', cod_operador)
  
  if (error) return { error: error.message }
  
  revalidatePath('/', 'layout')
  return { error: null }
}

// ============================================================
// PERFILES (extendido)
// ============================================================

export interface PerfilCompleto {
  id: string;
  cod_operador: string | null;
  rol: RolUsuario;
  nombre_visible: string | null;
  activo: boolean;
  created_at: string;
  operador?: Pick<Operador, 'cod_operador' | 'area'> | null;
}

export async function getPerfilCompleto(): Promise<{ data: PerfilCompleto | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }
  
  const { data: perfil, error } = await supabase
    .from('perfiles')
    .select(`
      *,
      operador:operadores!perfiles_cod_operador_fkey(cod_operador, area)
    `)
    .eq('id', user.id)
    .single()
  
  if (error) return { data: null, error: error.message }
  return { data: perfil as PerfilCompleto, error: null }
}

export async function updatePerfilNombre(nombre_visible: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  // Actualiza en auth.users.user_metadata
  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: nombre_visible.trim() }
  })
  if (authError) return { error: authError.message }
  
  // Actualiza en public.perfiles
  const { error: perfilError } = await supabase
    .from('perfiles')
    .update({ nombre_visible: nombre_visible.trim() })
    .eq('id', user.id)
  
  if (perfilError) return { error: perfilError.message }
  
  revalidatePath('/', 'layout')
  return { error: null }
}

export async function linkPerfilOperador(cod_operador: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  const { error } = await supabase
    .from('perfiles')
    .update({ cod_operador })
    .eq('id', user.id)
  
  if (error) return { error: error.message }
  
  revalidatePath('/', 'layout')
  return { error: null }
}