'use client'

import { useState, useEffect, useCallback } from 'react'
import { Flame, Package, Download, Trash2, Loader2, Clock } from 'lucide-react'
import { StationCard } from './StationCard'
import { RegistroList, EditRegistroRow } from './RegistroList'
import { ProfileModal } from './ProfileModal'
import { Header } from './Header'
import type { Operador } from '@/types/database'
import type { Registro } from './types'
import type { Comanda as DBComanda } from '@/types/database'
import { updateProfile, logout } from '../profile/actions'
import { createComanda } from '../actions/comandas'
import { useComandasRealtime } from '@/hooks/useComandasRealtime'

const COLABORADORES = ["BRENDA", "NAOMY", "PEDRO", "STEVEN", "ALVARO"]
const ESTACIONES = ["PLANCHA", "PACKER"]

interface DashboardClientProps {
  initialComandas: DBComanda[]
  initialOperadoresPlancha: Pick<Operador, 'cod_operador'>[]
  initialOperadoresPacker: Pick<Operador, 'cod_operador'>[]
  userName: string
  userRole: string
  userCodOperador: string | null
  metaSegundos: number
}

// Utilidades de timezone (Perú = America/Lima UTC-5)
function fromISOTime(isoStr: string | null): string {
  if (!isoStr) return ''
  return new Date(isoStr).toLocaleTimeString('es-PE', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Lima'
  })
}

function fromISODate(isoStr: string): string {
  return new Date(isoStr).toLocaleDateString('es-PE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    timeZone: 'America/Lima'
  })
}

function convertComandaToRegistro(c: DBComanda): Registro {
  const isPlancha = !!c.cod_oper_pl
  const horaInicioRaw = isPlancha ? c.hora_inicio_plancha : c.hora_inicio_packer
  const horaFinRaw = isPlancha ? c.hora_fin_plancha : c.hora_fin_packer
  const tiempoSegundos = isPlancha ? c.tiempo_plancha : c.tiempo_packer
  
  return {
    id: c.id,
    colaborador: (isPlancha ? c.cod_oper_pl : c.cod_oper_pk) ?? 'SIN OPERADOR',
    estacion: isPlancha ? 'PLANCHA' : 'PACKER',
    horaInicio: horaInicioRaw ? fromISOTime(horaInicioRaw) : '',
    horaFin: horaFinRaw ? fromISOTime(horaFinRaw) : '',
    tiempoTotal: tiempoSegundos ? Math.round(tiempoSegundos / 60) : 0,
    fecha: fromISODate(c.created_at),
  }
}

export function DashboardClient({ 
  initialComandas, 
  initialOperadoresPlancha, 
  initialOperadoresPacker,
  userName,
  userRole,
  userCodOperador,
  metaSegundos
}: DashboardClientProps) {
  // Estados principales - usar realtime hook
  const { comandas, isConnected, setComandas: setRealtimeComandas } = useComandasRealtime<DBComanda>(initialComandas)
  const [baseTime, setBaseTime] = useState<number>(metaSegundos / 60)
  const [isLoaded, setIsLoaded] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState<string | null>(null)

  // Convertir comandas a formato Registro para la UI
  const registros = comandas.map(convertComandaToRegistro)

  // Estados de Carril
  const [planchaCollab, setPlanchaCollab] = useState<string>('')
  const [planchaStart, setPlanchaStart] = useState<string>('')
  const [planchaEnd, setPlanchaEnd] = useState<string>('')

  const [packerCollab, setPackerCollab] = useState<string>('')
  const [packerStart, setPackerStart] = useState<string>('')
  const [packerEnd, setPackerEnd] = useState<string>('')

  // Perfil
  const [showProfile, setShowProfile] = useState(false)
  const [profileError, setProfileError] = useState<string>('')
  const [profileSuccess, setProfileSuccess] = useState<string>('')
  const [currentUserName, setCurrentUserName] = useState(userName)

  // Entrega Cliente (para calcular meta)
  const [entregaCliente, setEntregaCliente] = useState<string>('')

  // Cargar preferencias locales (no registros, vienen de realtime)
  useEffect(() => {
    const savedTime = localStorage.getItem('baseTime')
    const savedPlanchaCollab = localStorage.getItem('planchaCollab')
    const savedPackerCollab = localStorage.getItem('packerCollab')
    
    if (savedTime) setBaseTime(Number(savedTime))
    if (savedPlanchaCollab) setPlanchaCollab(savedPlanchaCollab)
    if (savedPackerCollab) setPackerCollab(savedPackerCollab)
    
    setIsLoaded(true)
  }, [])

  // Guardar preferencias locales (no registros)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('baseTime', baseTime.toString())
      localStorage.setItem('planchaCollab', planchaCollab)
      localStorage.setItem('packerCollab', packerCollab)
    }
  }, [baseTime, planchaCollab, packerCollab, isLoaded])

  // Utilidades
  const calculateMinutes = useCallback((start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    let diff = (endH * 60 + endM) - (startH * 60 + startM)
    if (diff < 0) diff += 24 * 60
    return diff
  }, [])

  // Convertir hora local (Perú UTC-5) a ISO UTC para guardar en BD
  const toISOTime = (timeStr: string) => {
    const today = new Date()
    const [h, m] = timeStr.split(':').map(Number)
    // Crear fecha en zona local (Perú) y convertir a UTC
    const localDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, 0)
    return localDate.toISOString()
  }

  // GUARDAR EN SUPABASE
  const handleGuardar = useCallback(async (estacion: 'PLANCHA' | 'PACKER') => {
    const isPlancha = estacion === 'PLANCHA'
    const collab = isPlancha ? planchaCollab : packerCollab
    const start = isPlancha ? planchaStart : packerStart
    const end = isPlancha ? planchaEnd : packerEnd

    if (!collab) {
      alert(`Falta asignar colaborador a ${estacion}.`)
      return
    }
    if (!start || !end) {
      alert(`Faltan horas en ${estacion}.`)
      return
    }

    setSaving(estacion)

    try {
      const id_orden = `GU-CMD-${Date.now().toString().slice(-6)}`
      const fase = 'pretest' // o 'postest' según tu lógica
      const turno = 1 // 1 = Almuerzo, 2 = Noche

      // hora_emision_caja = ahora (para calcular meta)
      const horaEmisionCaja = new Date().toISOString()

      const result = await createComanda({
        id_orden,
        fase,
        grupo: 'GU',
        turno,
        cod_oper_pl: isPlancha ? collab : undefined,
        cod_oper_pk: isPlancha ? undefined : collab,
        hora_emision_caja: horaEmisionCaja, // Auto-set para calcular meta
      })

      if (result.error) {
        alert(`Error: ${result.error}`)
        return
      }

      // Actualizar timestamps (hora_inicio, hora_fin, hora_emision_caja, hora_entrega_cliente)
      const comandaId = result.data!.id
      const updates: Record<string, string> = {
        hora_emision_caja: horaEmisionCaja,
      }
      
      if (isPlancha) {
        updates.hora_inicio_plancha = toISOTime(start)
        updates.hora_fin_plancha = toISOTime(end)
      } else {
        updates.hora_inicio_packer = toISOTime(start)
        updates.hora_fin_packer = toISOTime(end)
      }

      // Si hay entrega cliente, incluirla para calcular meta
      if (entregaCliente) {
        updates.hora_entrega_cliente = toISOTime(entregaCliente)
      }

      // Llamar API batch para actualizar timestamps
      const resp = await fetch('/api/comandas/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: comandaId, timestamps: updates })
      })

      const data = await resp.json()
      if (data.error) {
        console.error('Error actualizando timestamps:', data.error)
      }

      // Limpiar formulario
      if (isPlancha) {
        setPlanchaStart('')
        setPlanchaEnd('')
      } else {
        setPackerStart('')
        setPackerEnd('')
      }

      // NO reload - el realtime actualiza automáticamente
      // Optimistic update: agregamos localmente mientras llega del realtime
      const optimisticComanda: DBComanda = {
        id: `temp-${Date.now()}`,
        id_orden,
        fase,
        grupo: 'GU',
        turno,
        cod_oper_pl: isPlancha ? collab : null,
        cod_oper_pk: isPlancha ? null : collab,
        hora_inicio_plancha: isPlancha ? toISOTime(start) : null,
        hora_fin_plancha: isPlancha ? toISOTime(end) : null,
        hora_inicio_packer: isPlancha ? null : toISOTime(start),
        hora_fin_packer: isPlancha ? null : toISOTime(end),
        hora_entrega_cliente: entregaCliente ? toISOTime(entregaCliente) : null,
        hora_emision_caja: new Date().toISOString(),
        tiempo_plancha: isPlancha ? calculateMinutes(start, end) * 60 : null,
        tiempo_packer: isPlancha ? null : calculateMinutes(start, end) * 60,
        tiempo_despacho: entregaCliente ? calculateMinutes(
          new Date().toISOString().split('T')[1].slice(0,5), 
          entregaCliente
        ) * 60 : null,
        cumple_meta: entregaCliente ? (calculateMinutes(
          new Date().toISOString().split('T')[1].slice(0,5), 
          entregaCliente
        ) <= 480 ? 1 : 0) : null,
        created_at: new Date().toISOString(),
        user_id: '', // se llena en servidor
      }
      setRealtimeComandas(prev => [optimisticComanda, ...prev])

    } catch (err) {
      console.error('Error guardando:', err)
      alert('Error al guardar. Revisa la consola.')
    } finally {
      setSaving(null)
    }
  }, [planchaCollab, packerCollab, planchaStart, planchaEnd, packerStart, packerEnd, calculateMinutes, toISOTime, setRealtimeComandas])

  const handleDeleteRegistro = useCallback(async (id: string) => {
    if (window.confirm("¿Seguro que quieres eliminar este registro?")) {
      // Optimistic delete
      setRealtimeComandas(prev => prev.filter(c => c.id !== id))
      
      // Llamar API para borrar en Supabase
      try {
        await fetch(`/api/comandas/${id}`, { method: 'DELETE' })
      } catch (err) {
        console.error('Error borrando en Supabase:', err)
      }
    }
  }, [setRealtimeComandas])

  const handleUpdateRegistro = useCallback(async (updatedRegistro: Registro) => {
    const recalculatedTime = calculateMinutes(updatedRegistro.horaInicio, updatedRegistro.horaFin)
    const finalizedRegistro = { ...updatedRegistro, tiempoTotal: recalculatedTime }
    
    // Optimistic update en realtime
    setRealtimeComandas(prev => prev.map(c => {
      const registro = convertComandaToRegistro(c)
      if (registro.id === finalizedRegistro.id) {
        return {
          ...c,
          hora_inicio_plancha: updatedRegistro.estacion === 'PLANCHA' ? toISOTime(updatedRegistro.horaInicio) : c.hora_inicio_plancha,
          hora_fin_plancha: updatedRegistro.estacion === 'PLANCHA' ? toISOTime(updatedRegistro.horaFin) : c.hora_fin_plancha,
          hora_inicio_packer: updatedRegistro.estacion === 'PACKER' ? toISOTime(updatedRegistro.horaInicio) : c.hora_inicio_packer,
          hora_fin_packer: updatedRegistro.estacion === 'PACKER' ? toISOTime(updatedRegistro.horaFin) : c.hora_fin_packer,
        }
      }
      return c
    }))
    setEditingId(null)
    
    // Persistir en Supabase
    try {
      const comanda = comandas.find(c => convertComandaToRegistro(c).id === finalizedRegistro.id)
      if (comanda) {
        const updates: Record<string, string> = {}
        if (updatedRegistro.estacion === 'PLANCHA') {
          updates.hora_inicio_plancha = toISOTime(updatedRegistro.horaInicio)
          updates.hora_fin_plancha = toISOTime(updatedRegistro.horaFin)
        } else {
          updates.hora_inicio_packer = toISOTime(updatedRegistro.horaInicio)
          updates.hora_fin_packer = toISOTime(updatedRegistro.horaFin)
        }
        await fetch(`/api/comandas/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: comanda.id, timestamps: updates })
        })
      }
    } catch (err) {
      console.error('Error actualizando en Supabase:', err)
    }
  }, [calculateMinutes, toISOTime, setRealtimeComandas, comandas])

  const handleLimpiar = useCallback(() => {
    if (window.confirm("¿Confirmas eliminar TODOS los registros de hoy?")) {
      setRealtimeComandas([])
      localStorage.removeItem('registros')
    }
  }, [setRealtimeComandas])

  const handleExportarCSV = useCallback(() => {
    if (registros.length === 0) return
    const headers = ["Colaborador", "Estacion", "Hora Inicio", "Hora Fin", "Tiempo (min)", "Fecha"]
    const csvRows = registros.map(r => [r.colaborador, r.estacion, r.horaInicio, r.horaFin, r.tiempoTotal, r.fecha].join(","))
    const csvContent = [headers.join(","), ...csvRows].join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.body.appendChild(document.createElement("a"))
    link.href = url
    link.download = `Reporte_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [registros])

  const handleUpdateProfile = async (name: string) => {
    setProfileError('')
    setProfileSuccess('')
    
    if (!name.trim()) {
      setProfileError('El nombre es requerido')
      return
    }
    
    const response = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim() })
    })
    
    const data = await response.json()
    
    if (data.error) {
      setProfileError(data.error)
    } else {
      setCurrentUserName(name.trim())
      setProfileSuccess('Nombre actualizado correctamente')
      setShowProfile(false)
      setTimeout(() => setProfileSuccess(''), 3000)
    }
  }

  const handleLogout = async () => {
    await logout()
    window.location.href = '/login'
  }

  // Navegar a Analytics
  const handleAnalyticsClick = () => {
    window.location.href = '/analytics'
  }

  // Combinar operadores para modal de edición
  const allOperadores = [...initialOperadoresPlancha, ...initialOperadoresPacker]

  if (!isLoaded) return null

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 pb-12 font-sans">
      <Header
        baseTime={baseTime}
        setBaseTime={setBaseTime}
        userName={currentUserName}
        onProfileClick={() => setShowProfile(true)}
        onLogout={handleLogout}
        onAnalyticsClick={handleAnalyticsClick}
      />

      <main className="max-w-4xl mx-auto p-3 space-y-6 mt-2">
        <div className="grid md:grid-cols-2 gap-5">
          <StationCard 
            title="PLANCHA" 
            icon={Flame} 
            colorClass="bg-orange-500" 
            borderClass="border-orange-500" 
            collab={planchaCollab} 
            setCollab={setPlanchaCollab} 
            start={planchaStart} 
            setStart={setPlanchaStart} 
            end={planchaEnd} 
            setEnd={setPlanchaEnd} 
            onSave={() => handleGuardar('PLANCHA')}
            operadores={initialOperadoresPlancha}
            saving={saving === 'PLANCHA'}
          />
          <StationCard 
            title="PACKER" 
            icon={Package} 
            colorClass="bg-blue-500" 
            borderClass="border-blue-500" 
            collab={packerCollab} 
            setCollab={setPackerCollab} 
            start={packerStart} 
            setStart={setPackerStart} 
            end={packerEnd} 
            setEnd={setPackerEnd} 
            onSave={() => handleGuardar('PACKER')}
            operadores={initialOperadoresPacker}
            saving={saving === 'PACKER'}
          />
        </div>

        {/* Entrega Cliente - para calcular meta (≤8 min = 480 seg) */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="text-sm font-black text-gray-500 uppercase tracking-wider whitespace-nowrap">Entrega Cliente:</label>
            <div className="flex bg-white border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 shadow-inner">
              <input 
                type="time" 
                value={entregaCliente} 
                onChange={(e) => setEntregaCliente(e.target.value)} 
                className="w-40 bg-transparent p-3 font-black text-2xl text-center outline-none text-gray-800 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none" 
              />
              <button 
                onClick={() => setEntregaCliente(new Date().toLocaleTimeString('es-PE', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  timeZone: 'America/Lima'
                }))} 
                className="px-6 bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300 font-bold border-l-2 border-gray-200 flex items-center justify-center transition-colors"
                title="Hora actual"
              >
                <Clock size={26} />
              </button>
            </div>
            <span className="text-xs text-gray-500 ml-2">
              (Para calcular meta: ≤8 min = ✓ Cumple)
            </span>
          </div>
        </div>

        <RegistroList
          registros={registros}
          baseTime={baseTime}
          editingId={editingId}
          setEditingId={setEditingId}
          onUpdateRegistro={handleUpdateRegistro}
          onDeleteRegistro={handleDeleteRegistro}
          onExportCSV={handleExportarCSV}
          onClearAll={handleLimpiar}
          operadores={allOperadores}
          estaciones={ESTACIONES}
        />
      </main>

      <ProfileModal
        show={showProfile}
        onClose={() => setShowProfile(false)}
        userName={currentUserName}
        onUpdateName={handleUpdateProfile}
      />
    </div>
  )
}