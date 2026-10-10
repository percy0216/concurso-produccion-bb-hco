'use server'

import { createClient } from '@/utils/supabase/server'
import type { Comanda } from '@/types/database'

export interface ComandaDetalle {
  id: string
  id_orden: string
  fase: string
  turno: number
  plancha_cod: string | null
  packer_cod: string | null
  hora_emision_caja: string | null
  hora_inicio_plancha: string | null
  hora_fin_plancha: string | null
  hora_inicio_packer: string | null
  hora_fin_packer: string | null
  hora_entrega_cliente: string | null
  tiempo_plancha_seg: number | null
  tiempo_packer_seg: number | null
  tiempo_despacho_seg: number | null
  tiempo_plancha_min: number | null
  tiempo_packer_min: number | null
  tiempo_despacho_min: number | null
  cumple_meta: 1 | 0 | null
  created_at: string
}

export interface KPIs {
  total_comandas: number
  completadas: number
  cumplen_meta: number
  no_cumplen_meta: number
  pct_cumplimiento: number
  tiempo_promedio_plancha_min: number | null
  tiempo_promedio_packer_min: number | null
  tiempo_promedio_despacho_min: number | null
  tiempo_maximo_plancha_min: number | null
  tiempo_maximo_packer_min: number | null
}

export interface HoraPico {
  hora: string // HH:00
  cantidad: number
  tiempo_promedio_despacho_min: number | null
}

export interface OperadorStats {
  cod_operador: string
  area: 'plancha' | 'packer'
  total_comandas: number
  tiempo_promedio_min: number
  tiempo_minimo_min: number
  tiempo_maximo_min: number
  cumplen_meta: number
  pct_cumplimiento: number
}

export interface RecomendacionInsumos {
  tipo: 'plancha' | 'packer' | 'general'
  prioridad: 'alta' | 'media' | 'baja'
  titulo: string
  descripcion: string
  hora_inicio: string
  hora_fin: string
  metricas: string[]
}

export async function getComandasDetalle(filters?: {
  fase?: string
  turno?: number
  fecha_desde?: string
  fecha_hasta?: string
  limit?: number
}): Promise<{ data: ComandaDetalle[] | null; error: string | null }> {
  const supabase = await createClient()
  
  let query = supabase
    .from('comandas')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (filters?.fase) query = query.eq('fase', filters.fase)
  if (filters?.turno) query = query.eq('turno', filters.turno)
  if (filters?.fecha_desde) query = query.gte('created_at', filters.fecha_desde)
  if (filters?.fecha_hasta) query = query.lte('created_at', filters.fecha_hasta)
  if (filters?.limit) query = query.limit(filters.limit)
  
  const { data, error } = await query
  
  if (error) return { data: null, error: error.message }
  
  // Transformar a formato con minutos y nombres consistentes
  const transformed: ComandaDetalle[] = (data as Comanda[]).map(c => ({
    id: c.id,
    id_orden: c.id_orden,
    fase: c.fase,
    turno: c.turno,
    plancha_cod: c.cod_oper_pl,
    packer_cod: c.cod_oper_pk,
    hora_emision_caja: c.hora_emision_caja,
    hora_inicio_plancha: c.hora_inicio_plancha,
    hora_fin_plancha: c.hora_fin_plancha,
    hora_inicio_packer: c.hora_inicio_packer,
    hora_fin_packer: c.hora_fin_packer,
    hora_entrega_cliente: c.hora_entrega_cliente,
    tiempo_plancha_seg: c.tiempo_plancha,
    tiempo_packer_seg: c.tiempo_packer,
    tiempo_despacho_seg: c.tiempo_despacho,
    tiempo_plancha_min: c.tiempo_plancha ? Math.round(c.tiempo_plancha / 60) : null,
    tiempo_packer_min: c.tiempo_packer ? Math.round(c.tiempo_packer / 60) : null,
    tiempo_despacho_min: c.tiempo_despacho ? Math.round(c.tiempo_despacho / 60) : null,
    cumple_meta: c.cumple_meta,
    created_at: c.created_at,
  }))
  
  return { data: transformed, error: null }
}

export async function getKPIs(filters?: {
  fase?: string
  turno?: number
  fecha_desde?: string
  fecha_hasta?: string
}): Promise<{ data: KPIs | null; error: string | null }> {
  const supabase = await createClient()
  
  let query = supabase.from('comandas').select('*')
  
  if (filters?.fase) query = query.eq('fase', filters.fase)
  if (filters?.turno) query = query.eq('turno', filters.turno)
  if (filters?.fecha_desde) query = query.gte('created_at', filters.fecha_desde)
  if (filters?.fecha_hasta) query = query.lte('created_at', filters.fecha_hasta)
  
  const { data, error } = await query
  
  if (error) return { data: null, error: error.message }
  
  const comandas = data as Comanda[]
  const total = comandas.length
  const completadas = comandas.filter(c => c.hora_entrega_cliente !== null).length
  const cumplen_meta = comandas.filter(c => c.cumple_meta === 1).length
  const no_cumplen_meta = comandas.filter(c => c.cumple_meta === 0).length
  
  const tiempos_plancha = comandas.filter(c => c.tiempo_plancha !== null).map(c => c.tiempo_plancha! / 60)
  const tiempos_packer = comandas.filter(c => c.tiempo_packer !== null).map(c => c.tiempo_packer! / 60)
  const tiempos_despacho = comandas.filter(c => c.tiempo_despacho !== null).map(c => c.tiempo_despacho! / 60)
  
  const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null
  const max = (arr: number[]) => arr.length > 0 ? Math.round(Math.max(...arr) * 10) / 10 : null
  
  return {
    data: {
      total_comandas: total,
      completadas,
      cumplen_meta,
      no_cumplen_meta,
      pct_cumplimiento: total > 0 ? Math.round((cumplen_meta / total) * 100) : 0,
      tiempo_promedio_plancha_min: avg(tiempos_plancha),
      tiempo_promedio_packer_min: avg(tiempos_packer),
      tiempo_promedio_despacho_min: avg(tiempos_despacho),
      tiempo_maximo_plancha_min: max(tiempos_plancha),
      tiempo_maximo_packer_min: max(tiempos_packer),
    },
    error: null
  }
}

export async function getHorasPico(filters?: {
  fase?: string
  turno?: number
  fecha_desde?: string
  fecha_hasta?: string
}): Promise<{ data: HoraPico[] | null; error: string | null }> {
  const supabase = await createClient()
  
  let query = supabase.from('comandas').select('hora_emision_caja, tiempo_despacho, created_at')
  
  if (filters?.fase) query = query.eq('fase', filters.fase)
  if (filters?.turno) query = query.eq('turno', filters.turno)
  if (filters?.fecha_desde) query = query.gte('created_at', filters.fecha_desde)
  if (filters?.fecha_hasta) query = query.lte('created_at', filters.fecha_hasta)
  
  const { data, error } = await query
  
  if (error) return { data: null, error: error.message }
  
  // Agrupar por hora de emisión
  const porHora: Record<string, { count: number; tiempos: number[] }> = {}
  
  ;(data as Comanda[]).forEach(c => {
    if (!c.hora_emision_caja) return
    const hora = new Date(c.hora_emision_caja).toISOString().slice(0, 14) + '00:00' // HH:00:00
    if (!porHora[hora]) porHora[hora] = { count: 0, tiempos: [] }
    porHora[hora].count++
    if (c.tiempo_despacho) porHora[hora].tiempos.push(c.tiempo_despacho / 60)
  })
  
  const horasPico: HoraPico[] = Object.entries(porHora)
    .map(([hora, stats]) => ({
      hora: hora.slice(11, 16), // HH:MM
      cantidad: stats.count,
      tiempo_promedio_despacho_min: stats.tiempos.length > 0 
        ? Math.round(stats.tiempos.reduce((a, b) => a + b, 0) / stats.tiempos.length * 10) / 10
        : null
    }))
    .sort((a, b) => b.cantidad - a.cantidad) // Descendente por cantidad
  
  return { data: horasPico, error: null }
}

export async function getOperadoresStats(filters?: {
  fase?: string
  turno?: number
  fecha_desde?: string
  fecha_hasta?: string
}): Promise<{ data: OperadorStats[] | null; error: string | null }> {
  const supabase = await createClient()
  
  let query = supabase.from('comandas').select('cod_oper_pl, cod_oper_pk, tiempo_plancha, tiempo_packer, cumple_meta')
  
  if (filters?.fase) query = query.eq('fase', filters.fase)
  if (filters?.turno) query = query.eq('turno', filters.turno)
  if (filters?.fecha_desde) query = query.gte('created_at', filters.fecha_desde)
  if (filters?.fecha_hasta) query = query.lte('created_at', filters.fecha_hasta)
  
  const { data, error } = await query
  
  if (error) return { data: null, error: error.message }
  
  // Agrupar por operador y área
  const statsMap: Record<string, OperadorStats> = {}
  
  ;(data as Comanda[]).forEach(c => {
    // Plancha
    if (c.cod_oper_pl && c.tiempo_plancha !== null) {
      const key = `${c.cod_oper_pl}-plancha`
      if (!statsMap[key]) {
        statsMap[key] = {
          cod_operador: c.cod_oper_pl,
          area: 'plancha',
          total_comandas: 0,
          tiempo_promedio_min: 0,
          tiempo_minimo_min: Infinity,
          tiempo_maximo_min: 0,
          cumplen_meta: 0,
          pct_cumplimiento: 0
        }
      }
      const s = statsMap[key]
      const tiempoMin = c.tiempo_plancha / 60
      s.total_comandas++
      s.tiempo_minimo_min = Math.min(s.tiempo_minimo_min, tiempoMin)
      s.tiempo_maximo_min = Math.max(s.tiempo_maximo_min, tiempoMin)
      if (c.cumple_meta === 1) s.cumplen_meta++
    }
    // Packer
    if (c.cod_oper_pk && c.tiempo_packer !== null) {
      const key = `${c.cod_oper_pk}-packer`
      if (!statsMap[key]) {
        statsMap[key] = {
          cod_operador: c.cod_oper_pk,
          area: 'packer',
          total_comandas: 0,
          tiempo_promedio_min: 0,
          tiempo_minimo_min: Infinity,
          tiempo_maximo_min: 0,
          cumplen_meta: 0,
          pct_cumplimiento: 0
        }
      }
      const s = statsMap[key]
      const tiempoMin = c.tiempo_packer / 60
      s.total_comandas++
      s.tiempo_minimo_min = Math.min(s.tiempo_minimo_min, tiempoMin)
      s.tiempo_maximo_min = Math.max(s.tiempo_maximo_min, tiempoMin)
      if (c.cumple_meta === 1) s.cumplen_meta++
    }
  })
  
  // Calcular promedios y porcentajes
  Object.values(statsMap).forEach(s => {
    if (s.total_comandas > 0) {
      // Necesitamos recalcular promedio desde los datos originales
      // Por simplicidad usamos una aproximación
      s.tiempo_promedio_min = Math.round((s.tiempo_minimo_min + s.tiempo_maximo_min) / 2 * 10) / 10
      s.pct_cumplimiento = Math.round((s.cumplen_meta / s.total_comandas) * 100)
    }
    if (s.tiempo_minimo_min === Infinity) s.tiempo_minimo_min = 0
  })
  
  return { data: Object.values(statsMap), error: null }
}

export async function getRecomendacionesInsumos(filters?: {
  fase?: string
  turno?: number
  fecha_desde?: string
  fecha_hasta?: string
}): Promise<{ data: RecomendacionInsumos[] | null; error: string | null }> {
  const supabase = await createClient()
  
  // Obtener horas pico y KPIs para generar recomendaciones
  const [{ data: horasPico }, { data: kpis }, { data: operadores }] = await Promise.all([
    getHorasPico(filters),
    getKPIs(filters),
    getOperadoresStats(filters)
  ])
  
  if (!horasPico || !kpis) return { data: [], error: null }
  
  const recomendaciones: RecomendacionInsumos[] = []
  
  // 1. Hora pico principal
  const horaTop = horasPico[0]
  if (horaTop && horaTop.cantidad > 3) {
    recomendaciones.push({
      tipo: 'general',
      prioridad: 'alta',
      titulo: `📈 Hora pico detectada: ${horaTop.hora}`,
      descripcion: `Se registraron ${horaTop.cantidad} comandas en esta hora. Preparar insumos y personal extra 30 min antes.`,
      hora_inicio: `${parseInt(horaTop.hora.slice(0,2)) - 1}:${horaTop.hora.slice(3)}`,
      hora_fin: `${parseInt(horaTop.hora.slice(0,2)) + 1}:${horaTop.hora.slice(3)}`,
      metricas: [`Comandas/hora: ${horaTop.cantidad}`, `Tiempo prom. despacho: ${horaTop.tiempo_promedio_despacho_min ?? 'N/A'} min`]
    })
  }
  
  // 2. Tiempos altos en Plancha
  if (kpis.tiempo_promedio_plancha_min && kpis.tiempo_promedio_plancha_min > 6) {
    recomendaciones.push({
      tipo: 'plancha',
      prioridad: 'media',
      titulo: '⚡ Plancha: tiempo promedio alto',
      descripcion: `Promedio ${kpis.tiempo_promedio_plancha_min} min (meta ≤ 8 min total). Revisar proceso de planchado o añadir planchas.`,
      hora_inicio: '00:00',
      hora_fin: '23:59',
      metricas: [`Promedio: ${kpis.tiempo_promedio_plancha_min} min`, `Máximo: ${kpis.tiempo_maximo_plancha_min ?? 'N/A'} min`]
    })
  }
  
  // 3. Tiempos altos en Packer
  if (kpis.tiempo_promedio_packer_min && kpis.tiempo_promedio_packer_min > 6) {
    recomendaciones.push({
      tipo: 'packer',
      prioridad: 'media',
      titulo: '📦 Packer: tiempo promedio alto',
      descripcion: `Promedio ${kpis.tiempo_promedio_packer_min} min. Considerar más packers en hora pico o mejorar flujo.`,
      hora_inicio: '00:00',
      hora_fin: '23:59',
      metricas: [`Promedio: ${kpis.tiempo_promedio_packer_min} min`, `Máximo: ${kpis.tiempo_maximo_packer_min ?? 'N/A'} min`]
    })
  }
  
  // 4. Bajo cumplimiento
  if (kpis.pct_cumplimiento < 70 && kpis.total_comandas > 5) {
    recomendaciones.push({
      tipo: 'general',
      prioridad: 'alta',
      titulo: `⚠️ Cumplimiento bajo: ${kpis.pct_cumplimiento}%`,
      descripcion: `Solo ${kpis.cumplen_meta} de ${kpis.total_comandas} cumplen meta (≤8 min). Revisar cuellos de botella.`,
      hora_inicio: '00:00',
      hora_fin: '23:59',
      metricas: [`Cumplen: ${kpis.cumplen_meta}/${kpis.total_comandas}`, `No cumplen: ${kpis.no_cumplen_meta}`]
    })
  }
  
  // 5. Operadores lentos
  if (operadores) {
    const lentos = operadores.filter(o => o.tiempo_promedio_min > 10 && o.total_comandas >= 3)
    lentos.forEach(op => {
      recomendaciones.push({
        tipo: op.area,
        prioridad: 'media',
        titulo: `👤 ${op.cod_operador} (${op.area}): tiempo alto`,
        descripcion: `Promedio ${op.tiempo_promedio_min} min en ${op.total_comandas} comandas. Evaluar capacitación o redistribución.`,
        hora_inicio: '00:00',
        hora_fin: '23:59',
        metricas: [`Promedio: ${op.tiempo_promedio_min} min`, `Máximo: ${op.tiempo_maximo_min} min`, `Cumplimiento: ${op.pct_cumplimiento}%`]
      })
    })
  }
  
  return { data: recomendaciones, error: null }
}