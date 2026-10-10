'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  console.log('--- INTENTO DE LOGIN ---')
  console.log('email recibido:', JSON.stringify(data.email))
  console.log('password recibido (largo):', data.password?.length)

  const { data: authData, error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    console.log('ERROR DE SUPABASE:', error.message, '| status:', error.status)
    redirect('/login?error=' + encodeURIComponent(error.message))
  }

  console.log('LOGIN OK, usuario:', authData.user?.email)
  console.log('session existe?:', !!authData.session)

  revalidatePath('/', 'layout')
  redirect('/')
}

// No hay signup público: las cuentas las crea el administrador
// directamente desde Authentication → Users en el panel de Supabase.

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}