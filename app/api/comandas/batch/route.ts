import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { TimestampEvent } from '@/types/database'

const TIMESTAMP_COLUMNS: Record<TimestampEvent, string> = {
  hora_emision_caja: 'hora_emision_caja',
  hora_inicio_plancha: 'hora_inicio_plancha',
  hora_fin_plancha: 'hora_fin_plancha',
  hora_inicio_packer: 'hora_inicio_packer',
  hora_fin_packer: 'hora_fin_packer',
  hora_entrega_cliente: 'hora_entrega_cliente',
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, timestamps } = body as { 
      id: string; 
      timestamps: Partial<Record<TimestampEvent, string>> 
    }
    
    if (!id || !timestamps) {
      return NextResponse.json({ error: 'Faltan parámetros: id, timestamps' }, { status: 400 })
    }
    
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
      return NextResponse.json({ error: 'No hay timestamps válidos' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    
    const { data, error } = await supabase
      .from('comandas')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data })
  } catch (err) {
    console.error('Error batch updating timestamps:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}