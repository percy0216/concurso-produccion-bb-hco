import { createClient } from '@/utils/supabase/server'
import { AnalyticsClient } from './AnalyticsClient'

export const dynamic = 'force-dynamic'

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre_visible, rol')
    .eq('id', user.id)
    .single()

  return <AnalyticsClient userName={perfil?.nombre_visible || user.email?.split('@')[0] || 'Usuario'} userRole={perfil?.rol || 'plancha'} />
}