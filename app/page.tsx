import { createClient } from '@/utils/supabase/server'
import { DashboardClient } from './components/DashboardClient'
import type { Comanda, Operador } from '@/types/database'

// Server Component: fetch inicial en el servidor
export default async function Home() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null // El middleware redirige a /login

  // Obtener perfil del usuario
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('nombre_visible, rol, cod_operador')
    .eq('id', user.id)
    .single()

  // Obtener comandas del usuario (RLS filtra automáticamente)
  const { data: comandas } = await supabase
    .from('comandas')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  // Obtener operadores activos para selects
  const { data: operadoresPlancha } = await supabase
    .from('operadores')
    .select('cod_operador')
    .eq('area', 'plancha')
    .eq('activo', true)
    .order('cod_operador')

  const { data: operadoresPacker } = await supabase
    .from('operadores')
    .select('cod_operador')
    .eq('area', 'packer')
    .eq('activo', true)
    .order('cod_operador')

  // Obtener meta del usuario (o default 8 min = 480s)
  const metaSegundos = 480

  return (
    <DashboardClient
      initialComandas={comandas as Comanda[] || []}
      initialOperadoresPlancha={operadoresPlancha as Operador[] || []}
      initialOperadoresPacker={operadoresPacker as Operador[] || []}
      userName={perfil?.nombre_visible || user.email?.split('@')[0] || 'Usuario'}
      userRole={perfil?.rol || 'plancha'}
      userCodOperador={perfil?.cod_operador}
      metaSegundos={metaSegundos}
    />
  )
}