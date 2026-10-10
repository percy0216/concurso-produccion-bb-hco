'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getProfile() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { user: null, error: 'No autenticado' }
  }
  
  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    },
    error: null,
  }
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  
  if (!name || name.trim().length === 0) {
    return { error: 'El nombre es requerido' }
  }
  
  const { error } = await supabase.auth.updateUser({
    data: { full_name: name.trim() }
  })
  
  if (error) {
    return { error: error.message }
  }
  
  revalidatePath('/', 'layout')
  return { error: null }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { error: null }
}