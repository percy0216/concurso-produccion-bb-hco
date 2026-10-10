import { createClient } from '@/utils/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ user: null, error: 'No autenticado' }, { status: 401 })
  }
  
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    },
    error: null,
  })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  
  const body = await request.json()
  const name = body.name
  
  if (!name || name.trim().length === 0) {
    return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  }
  
  const { error } = await supabase.auth.updateUser({
    data: { full_name: name.trim() }
  })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }
  
  return NextResponse.json({ error: null })
}