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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { event, value } = body as { event: TimestampEvent; value: string }
    
    if (!event || !value) {
      return NextResponse.json({ error: 'Faltan parámetros: event, value' }, { status: 400 })
    }
    
    const column = TIMESTAMP_COLUMNS[event]
    if (!column) {
      return NextResponse.json({ error: 'Evento de timestamp inválido' }, { status: 400 })
    }
    
    // Validar timestamp ISO
    const timestamp = new Date(value)
    if (isNaN(timestamp.getTime())) {
      return NextResponse.json({ error: 'Timestamp inválido' }, { status: 400 })
    }
    
    const supabase = await createClient()
    
    // Verificar que el usuario está autenticado
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }
    
    const { data, error } = await supabase
      .from('comandas')
      .update({ [column]: value })
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ data })
  } catch (err) {
    console.error('Error updating timestamp:', err)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}