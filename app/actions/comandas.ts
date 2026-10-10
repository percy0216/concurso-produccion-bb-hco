'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Comanda, ComandaInput, ComandaTimestampUpdate, TimestampEvent, Fase, Turno } from '@/types/database'

// ============================================================
// COMANDAS - CRUD
// ============================================================

export async function getComandas(filters?: {
  fase?: Fase;
  turno?: Turno;
  limit?: number;
  offset?: number;
}): Promise<{ data: Comanda[] | null; error: string | null; count: number | null }> {
  const supabase = await createClient()
  
  let query = supabase
    .from('comandas')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
  
  if (filters?.fase) query = query.eq('fase', filters.fase)
  if (filters?.turno) query = query.eq('turno', filters.turno)
  if (filters?.limit) query = query.limit(filters.limit)
  if (filters?.offset) query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
  
  const { data, error, count } = await query
  
  if (error) return { data: null, error: error.message, count: null }
  return { data: data as Comanda[], error: null, count }
}

export async function getComandaById(id: string): Promise<{ data: Comanda | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('comandas')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) return { data: null, error: error.message }
  return { data: data as Comanda, error: null }
}

export async function getComandaByOrden(id_orden: string): Promise<{ data: Comanda | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('comandas')
    .select('*')
    .eq('id_orden', id_orden)
    .single()
  
  if (error) return { data: null, error: error.message }
  return { data: data as Comanda, error: null }
}

export async function createComanda(input: ComandaInput): Promise<{ data: Comanda | null; error: string | null }> {
  const supabase = await createClient()
  
  // Obtener usuario actual
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { data: null, error: 'No autenticado' }
  
  const { data, error } = await supabase
    .from('comandas')
    .insert({
      id_orden: input.id_orden,
      fase: input.fase,
      grupo: input.grupo ?? 'GU',
      turno: input.turno,
      cod_oper_pl: input.cod_oper_pl ?? null,
      cod_oper_pk: input.cod_oper_pk ?? null,
      hora_emision_caja: input.hora_emision_caja ?? null,
      user_id: user.id,  // Asignar owner automáticamente
    })
    .select()
    .single()
  
  if (error) return { data: null, error: error.message }
  
  revalidatePath('/', 'layout')
  return { data: data as Comanda, error: null }
}

export async function updateComandaOperadores(
  id: string,
  cod_oper_pl?: string,
  cod_oper_pk?: string
): Promise<{ data: Comanda | null; error: string | null }> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('comandas')
    .update({
      cod_oper_pl: cod_oper_pl ?? null,
      cod_oper_pk: cod_oper_pk ?? null,
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) return { data: null, error: error.message }
  
  revalidatePath('/', 'layout')
  return { data: data as Comanda, error: null }
}

// ============================================================
// TIMESTAMPS - Actualización en tiempo real (PWA)
// ============================================================

const TIMESTAMP_COLUMNS: Record<TimestampEvent, string> = {
  hora_emision_caja: 'hora_emision_caja',
  hora_inicio_plancha: 'hora_inicio_plancha',
  hora_fin_plancha: 'hora_fin_plancha',
  hora_inicio_packer: 'hora_inicio_packer',
  hora_fin_packer: 'hora_fin_packer',
  hora_entrega_cliente: 'hora_entrega_cliente',
}

export async function updateComandaTimestamp(
  input: ComandaTimestampUpdate
): Promise<{ data: Comanda | null; error: string | null }> {
  const supabase = await createClient()
  
  const column = TIMESTAMP_COLUMNS[input.event]
  if (!column) return { data: null, error: 'Evento de timestamp inválido' }
  
  // Validar que el valor sea un ISO timestamp válido
  const timestamp = new Date(input.value)
  if (isNaN(timestamp.getTime())) return { data: null, error: 'Timestamp inválido' }
  
  const { data, error } = await supabase
    .from('comandas')
    .update({ [column]: input.value })
    .eq('id', input.id)
    .select()
    .single()
  
  if (error) return { data: null, error: error.message }
  
  // No revalidamos aquí para no interrumpir la PWA en tiempo real
  // El realtime se encarga de actualizar la UI
  return { data: data as Comanda, error: null }
}

// Batch update para cuando la PWA envía múltiples timestamps a la vez
export async function updateComandaTimestampsBatch(
  id: string,
  timestamps: Partial<Record<TimestampEvent, string>>
): Promise<{ data: Comanda | null; error: string | null }> {
  const supabase = await createClient()
  
  const updates: Record<string, string> = {}
  for (const [event, value] of Object.entries(timestamps)) {
    if (value && TIMESTAMP_COLUMNS[event as TimestampEvent]) {
      const ts = new Date(value)
      if (!isNaN(ts.getTime())) {
        updates[TIMESTAMP_COLUMNS[event as TimestampEvent]] = value
      }
    }
  }
  
  if (Object.keys(updates).length === 0) {
    return { data: null, error: 'No hay timestamps válidos para actualizar' }
  }
  
  const { data, error } = await supabase
    .from('comandas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  
  if (error) return { data: null, error: error.message }
  
  return { data: data as Comanda, error: null }
}

// ============================================================
// ELIMINACIÓN (solo supervisor/admin por RLS)
// ============================================================

export async function deleteComanda(id: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('comandas')
    .delete()
    .eq('id', id)
  
  if (error) return { error: error.message }
  
  revalidatePath('/', 'layout')
  return { error: null }
}

export async function deleteComandasByFilters(filters: {
  fase?: Fase;
  turno?: Turno;
  fecha_desde?: string;
  fecha_hasta?: string;
}): Promise<{ count: number; error: string | null }> {
  const supabase = await createClient()
  
  let query = supabase.from('comandas').delete()
  
  if (filters.fase) query = query.eq('fase', filters.fase)
  if (filters.turno) query = query.eq('turno', filters.turno)
  if (filters.fecha_desde) query = query.gte('created_at', filters.fecha_desde)
  if (filters.fecha_hasta) query = query.lte('created_at', filters.fecha_hasta)
  
  const { error, count } = await query
  
  if (error) return { count: 0, error: error.message }
  
  revalidatePath('/', 'layout')
  return { count: count ?? 0, error: null }
}

// ============================================================
// ESTADÍSTICAS / REPORTES
// ============================================================

export interface EstadisticasComandas {
  total: number;
  completadas: number;
  cumplen_meta: number;
  no_cumplen_meta: number;
  porcentaje_cumplimiento: number;
  tiempo_promedio_despacho_segundos: number | null;
  tiempo_promedio_plancha_segundos: number | null;
  tiempo_promedio_packer_segundos: number | null;
}

export async function getEstadisticas(filters?: {
  fase?: Fase;
  turno?: Turno;
  fecha_desde?: string;
  fecha_hasta?: string;
}): Promise<{ data: EstadisticasComandas | null; error: string | null }> {
  const supabase = await createClient()
  
  let query = supabase.from('comandas').select('*', { count: 'exact' })
  
  if (filters?.fase) query = query.eq('fase', filters.fase)
  if (filters?.turno) query = query.eq('turno', filters.turno)
  if (filters?.fecha_desde) query = query.gte('created_at', filters.fecha_desde)
  if (filters?.fecha_hasta) query = query.lte('created_at', filters.fecha_hasta)
  
  const { data, error, count } = await query
  
  if (error) return { data: null, error: error.message }
  
  const comandas = data as Comanda[]
  const total = count ?? comandas.length
  const completadas = comandas.filter(c => c.hora_entrega_cliente !== null).length
  const cumplen_meta = comandas.filter(c => c.cumple_meta === 1).length
  const no_cumplen_meta = comandas.filter(c => c.cumple_meta === 0).length
  
  const tiempos_despacho = comandas
    .filter(c => c.tiempo_despacho !== null)
    .map(c => c.tiempo_despacho!)
  const tiempos_plancha = comandas
    .filter(c => c.tiempo_plancha !== null)
    .map(c => c.tiempo_plancha!)
  const tiempos_packer = comandas
    .filter(c => c.tiempo_packer !== null)
    .map(c => c.tiempo_packer!)
  
  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null
  
  return {
    data: {
      total,
      completadas,
      cumplen_meta,
      no_cumplen_meta,
      porcentaje_cumplimiento: total > 0 ? Math.round((cumplen_meta / total) * 100) : 0,
      tiempo_promedio_despacho_segundos: avg(tiempos_despacho),
      tiempo_promedio_plancha_segundos: avg(tiempos_plancha),
      tiempo_promedio_packer_segundos: avg(tiempos_packer),
    },
    error: null,
  }
}

// ============================================================
// EXPORTACIÓN (para Power BI / Excel / SPSS)
// ============================================================

export async function exportComandasToCSV(filters?: {
  fase?: Fase;
  turno?: Turno;
  fecha_desde?: string;
  fecha_hasta?: string;
}): Promise<{ data: string | null; error: string | null }> {
  const supabase = await createClient()
  
  let query = supabase
    .from('vista_resultados')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (filters?.fase) query = query.eq('fase', filters.fase)
  if (filters?.turno) query = query.eq('turno', filters.turno)
  if (filters?.fecha_desde) query = query.gte('created_at', filters.fecha_desde)
  if (filters?.fecha_hasta) query = query.lte('created_at', filters.fecha_hasta)
  
  const { data, error } = await query
  
  if (error) return { data: null, error: error.message }
  
  if (!data || data.length === 0) return { data: '', error: null }
  
  // Headers exactamente como el diccionario de variables
  const headers = [
    'id_orden',
    'grupo',
    'turno',
    'cod_oper_pl',
    'tiempo_plancha',
    'cod_oper_pk',
    'tiempo_packer',
    'tiempo_despacho',
    'cumple_meta',
    'fase',
    'created_at'
  ]
  
  const rows = data.map(row => headers.map(h => {
    const val = row[h as keyof typeof row]
    if (val === null || val === undefined) return ''
    if (typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))) {
      return `"${val.replace(/"/g, '""')}"`
    }
    return String(val)
  }).join(','))
  
  const csv = [headers.join(','), ...rows].join('\n')
  
  return { data: csv, error: null }
}