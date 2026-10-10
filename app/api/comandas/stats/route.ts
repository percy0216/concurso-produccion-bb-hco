import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fase = searchParams.get('fase') as 'pretest' | 'postest' | null
    const turno = searchParams.get('turno') ? parseInt(searchParams.get('turno')!) : null
    const fecha_desde = searchParams.get('fecha_desde')
    const fecha_hasta = searchParams.get('fecha_hasta')
    
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    
    let query = supabase.from('comandas').select('*')
    
    if (fase) query = query.eq('fase', fase)
    if (turno) query = query.eq('turno', turno)
    if (fecha_desde) query = query.gte('created_at', fecha_desde)
    if (fecha_hasta) query = query.lte('created_at', fecha_hasta)
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    const comandas = data as Array<{
      tiempo_despacho: number | null
      tiempo_plancha: number | null
      tiempo_packer: number | null
      cumple_meta: 1 | 0 | null
      hora_entrega_cliente: string | null
    }>
    
    const total = comandas.length
    const completadas = comandas.filter(c => c.hora_entrega_cliente !== null).length
    const cumplen_meta = comandas.filter(c => c.cumple_meta === 1).length
    const no_cumplen_meta = comandas.filter(c => c.cumple_meta === 0).length
    
    const tiempos_despacho = comandas.filter(c => c.tiempo_despacho !== null).map(c => c.tiempo_despacho!)
    const tiempos_plancha = comandas.filter(c => c.tiempo_plancha !== null).map(c => c.tiempo_plancha!)
    const tiempos_packer = comandas.filter(c => c.tiempo_packer !== null).map(c => c.tiempo_packer!)
    
    const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : null
    
    return NextResponse.json({
      data: {
        total,
        completadas,
        cumplen_meta,
        no_cumplen_meta,
        porcentaje_cumplimiento: total > 0 ? Math.round((cumplen_meta / total) * 100) : 0,
        tiempo_promedio_despacho_segundos: avg(tiempos_despacho),
        tiempo_promedio_plancha_segundos: avg(tiempos_plancha),
        tiempo_promedio_packer_segundos: avg(tiempos_packer),
      }
    })
  } catch (err) {
    console.error('Error getting stats:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}