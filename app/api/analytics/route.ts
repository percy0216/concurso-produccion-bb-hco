import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Comanda } from '@/types/database'

interface Filters {
  fase?: string
  turno?: number
  fecha_desde?: string
  fecha_hasta?: string
  limit?: number
}

async function getFilters(request: NextRequest): Promise<Filters> {
  const { searchParams } = new URL(request.url)
  return {
    fase: searchParams.get('fase') || undefined,
    turno: searchParams.get('turno') ? parseInt(searchParams.get('turno')!) : undefined,
    fecha_desde: searchParams.get('fecha_desde') || undefined,
    fecha_hasta: searchParams.get('fecha_hasta') || undefined,
    limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
  }
}

function applyFilters(query: any, filters: Filters) {
  if (filters.fase) query = query.eq('fase', filters.fase)
  if (filters.turno) query = query.eq('turno', filters.turno)
  if (filters.fecha_desde) query = query.gte('created_at', filters.fecha_desde)
  if (filters.fecha_hasta) query = query.lte('created_at', filters.fecha_hasta)
  return query
}

function avg(arr: number[]): number | null {
  return arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null
}

function maxVal(arr: number[]): number | null {
  return arr.length > 0 ? Math.round(Math.max(...arr) * 10) / 10 : null
}

async function fetchComandas(supabase: any, filters: Filters) {
  let query = supabase.from('comandas').select('*')
  query = applyFilters(query, filters)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as Comanda[]
}

async function fetchComandasOrdered(supabase: any, filters: Filters, limit?: number) {
  let query = supabase.from('comandas').select('*').order('created_at', { ascending: false })
  query = applyFilters(query, filters)
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data as Comanda[]
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

    const filters = await getFilters(request)
    const tipo = new URL(request.url).searchParams.get('tipo') || 'kpis'

    // Fetch base data once
    const comandas = await fetchComandas(supabase, filters)

    // Helper functions
    const toMin = (seg: number | null) => seg ? Math.round(seg / 60) : null
    const avg = (arr: number[]) => arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length * 10) / 10 : null
    const maxV = (arr: number[]) => arr.length > 0 ? Math.round(Math.max(...arr) * 10) / 10 : null

    // Compute KPIs
    const total = comandas.length
    const completadas = comandas.filter(c => c.hora_entrega_cliente !== null).length
    const cumplen_meta = comandas.filter(c => c.cumple_meta === 1).length
    const no_cumplen_meta = comandas.filter(c => c.cumple_meta === 0).length
    const tiempos_plancha = comandas.filter(c => c.tiempo_plancha !== null).map(c => c.tiempo_plancha! / 60)
    const tiempos_packer = comandas.filter(c => c.tiempo_packer !== null).map(c => c.tiempo_packer! / 60)
    const tiempos_despacho = comandas.filter(c => c.tiempo_despacho !== null).map(c => c.tiempo_despacho! / 60)
    const kpis = {
      total_comandas: total,
      completadas,
      cumplen_meta,
      no_cumplen_meta,
      pct_cumplimiento: total > 0 ? Math.round((cumplen_meta / total) * 100) : 0,
      tiempo_promedio_plancha_min: avg(tiempos_plancha),
      tiempo_promedio_packer_min: avg(tiempos_packer),
      tiempo_promedio_despacho_min: avg(tiempos_despacho),
      tiempo_maximo_plancha_min: maxV(tiempos_plancha),
      tiempo_maximo_packer_min: maxV(tiempos_packer),
    }

    // Compute Horas Pico
    const porHora: Record<string, { count: number; tiempos: number[] }> = {}
    comandas.forEach(c => {
      if (!c.hora_emision_caja) return
      const hora = new Date(c.hora_emision_caja).toISOString().slice(0, 14) + '00:00'
      if (!porHora[hora]) porHora[hora] = { count: 0, tiempos: [] }
      porHora[hora].count++
      if (c.tiempo_despacho) porHora[hora].tiempos.push(c.tiempo_despacho / 60)
    })
    const horasPico = Object.entries(porHora)
      .map(([hora, stats]) => ({
        hora: hora.slice(11, 16),
        cantidad: stats.count,
        tiempo_promedio_despacho_min: stats.tiempos.length > 0 ? avg(stats.tiempos) : null
      }))
      .sort((a, b) => b.cantidad - a.cantidad)

    // Compute Operadores
    const statsMap: Record<string, any> = {}
    comandas.forEach(c => {
      if (c.cod_oper_pl && c.tiempo_plancha !== null) {
        const key = `${c.cod_oper_pl}-plancha`
        if (!statsMap[key]) statsMap[key] = { cod_operador: c.cod_oper_pl, area: 'plancha', total_comandas: 0, tiempo_minimo_min: Infinity, tiempo_maximo_min: 0, cumplen_meta: 0 }
        const s = statsMap[key]
        const t = c.tiempo_plancha / 60
        s.total_comandas++
        s.tiempo_minimo_min = Math.min(s.tiempo_minimo_min, t)
        s.tiempo_maximo_min = Math.max(s.tiempo_maximo_min, t)
        if (c.cumple_meta === 1) s.cumplen_meta++
      }
      if (c.cod_oper_pk && c.tiempo_packer !== null) {
        const key = `${c.cod_oper_pk}-packer`
        if (!statsMap[key]) statsMap[key] = { cod_operador: c.cod_oper_pk, area: 'packer', total_comandas: 0, tiempo_minimo_min: Infinity, tiempo_maximo_min: 0, cumplen_meta: 0 }
        const s = statsMap[key]
        const t = c.tiempo_packer / 60
        s.total_comandas++
        s.tiempo_minimo_min = Math.min(s.tiempo_minimo_min, t)
        s.tiempo_maximo_min = Math.max(s.tiempo_maximo_min, t)
        if (c.cumple_meta === 1) s.cumplen_meta++
      }
    })
    const operadores = Object.values(statsMap).map(s => {
      if (s.total_comandas > 0) {
        s.tiempo_promedio_min = Math.round((s.tiempo_minimo_min + s.tiempo_maximo_min) / 2 * 10) / 10
        s.pct_cumplimiento = Math.round((s.cumplen_meta / s.total_comandas) * 100)
      }
      if (s.tiempo_minimo_min === Infinity) s.tiempo_minimo_min = 0
      return s
    })

    // Generate Recomendaciones
    const recomendaciones: any[] = []
    const horaTop = horasPico[0]
    if (horaTop && horaTop.cantidad > 3) {
      recomendaciones.push({
        tipo: 'general',
        prioridad: 'alta',
        titulo: `📈 Hora pico detectada: ${horaTop.hora}`,
        descripcion: `Se registraron ${horaTop.cantidad} comandas en esta hora. Preparar insumos y personal extra 30 min antes.`,
        hora_inicio: `${Math.max(0, parseInt(horaTop.hora.slice(0,2)) - 1)}:${horaTop.hora.slice(3)}`,
        hora_fin: `${Math.min(23, parseInt(horaTop.hora.slice(0,2)) + 1)}:${horaTop.hora.slice(3)}`,
        metricas: [`Comandas/hora: ${horaTop.cantidad}`, `Tiempo prom. despacho: ${horaTop.tiempo_promedio_despacho_min ?? 'N/A'} min`]
      })
    }
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

    // Return based on tipo
    switch (tipo) {
      case 'detalle': {
        const comandasLimit = await fetchComandasOrdered(supabase, filters, filters.limit)
        const transformed = comandasLimit.map(c => ({
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
          tiempo_plancha_min: toMin(c.tiempo_plancha),
          tiempo_packer_min: toMin(c.tiempo_packer),
          tiempo_despacho_min: toMin(c.tiempo_despacho),
          cumple_meta: c.cumple_meta,
          created_at: c.created_at,
        }))
        return NextResponse.json({ data: transformed })
      }

      case 'kpis':
        return NextResponse.json({ data: kpis })

      case 'horas-pico':
        return NextResponse.json({ data: horasPico })

      case 'operadores': {
        const ops = Object.values(statsMap).map(s => {
          if (s.total_comandas > 0) {
            s.tiempo_promedio_min = Math.round((s.tiempo_minimo_min + s.tiempo_maximo_min) / 2 * 10) / 10
            s.pct_cumplimiento = Math.round((s.cumplen_meta / s.total_comandas) * 100)
          }
          if (s.tiempo_minimo_min === Infinity) s.tiempo_minimo_min = 0
          return s
        })
        return NextResponse.json({ data: operadores })
      }

      case 'recomendaciones':
        return NextResponse.json({ data: recomendaciones })

      default:
        return NextResponse.json({ error: 'Tipo inválido. Use: kpis, detalle, horas-pico, operadores, recomendaciones' }, { status: 400 })
    }

  } catch (err) {
    console.error('Error analytics:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}