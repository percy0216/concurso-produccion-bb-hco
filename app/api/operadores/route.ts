import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
  }

  // Test query operadores
  const { data: plancha, error: errPlancha } = await supabase
    .from('operadores')
    .select('cod_operador, area, activo')
    .eq('area', 'plancha')
    .eq('activo', true)
    .order('cod_operador')

  const { data: packer, error: errPacker } = await supabase
    .from('operadores')
    .select('cod_operador, area, activo')
    .eq('area', 'packer')
    .eq('activo', true)
    .order('cod_operador')

  // Test RLS: check if we can read perfiles
  const { data: perfil, error: errPerfil } = await supabase
    .from('perfiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return NextResponse.json({
    user: user.id,
    operadores: {
      plancha: { data: plancha, error: errPlancha?.message },
      packer: { data: packer, error: errPacker?.message },
    },
    perfil: { data: perfil, error: errPerfil?.message },
  })
}