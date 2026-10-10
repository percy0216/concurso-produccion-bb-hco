import type { Operador } from '@/types/database'

export interface Comanda {
  id: string
  id_orden: string
  fase: string
  grupo: string
  turno: number
  cod_oper_pl: string | null
  cod_oper_pk: string | null
  hora_inicio_plancha: string | null
  hora_fin_plancha: string | null
  hora_inicio_packer: string | null
  hora_fin_packer: string | null
  hora_entrega_cliente: string | null
  hora_emision_caja: string | null
  tiempo_plancha: number | null
  tiempo_packer: number | null
  tiempo_despacho: number | null
  cumple_meta: 1 | 0 | null
  created_at: string
  user_id: string
}

export interface StationCardProps {
  title: 'PLANCHA' | 'PACKER'
  icon: React.ComponentType<{ size?: number }>
  colorClass: string
  borderClass: string
  collab: string
  setCollab: (value: string) => void
  start: string
  setStart: (value: string) => void
  end: string
  setEnd: (value: string) => void
  onSave: () => void
  operadores: Pick<Operador, 'cod_operador'>[]
  saving?: boolean
}

export interface Registro {
  id: string
  colaborador: string
  estacion: string
  horaInicio: string
  horaFin: string
  tiempoTotal: number
  fecha: string
}

export interface EditRegistroRowProps {
  registro: Registro
  onSave: (r: Registro) => void
  onCancel: () => void
  operadores: Pick<Operador, 'cod_operador'>[]
  estaciones: string[]
}