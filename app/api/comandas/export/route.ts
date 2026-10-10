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
    
    let query = supabase
      .from('vista_resultados')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (fase) query = query.eq('fase', fase)
    if (turno) query = query.eq('turno', turno)
    if (fecha_desde) query = query.gte('created_at', fecha_desde)
    if (fecha_hasta) query = query.lte('created_at', fecha_hasta)
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    if (!data || data.length === 0) {
      return new NextResponse('', { 
        headers: { 'Content-Type': 'text/csv; charset=utf-8' }
      })
    }
    
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
    
    const filename = `reporte_${new Date().toISOString().split('T')[0]}.csv`
    
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('Error exporting CSV:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}