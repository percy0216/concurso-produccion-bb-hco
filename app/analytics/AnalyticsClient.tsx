'use client'

import { useState, useEffect, useMemo } from 'react'
import { 
  Timer, TrendingUp, TrendingDown, AlertTriangle, Users, Package, Zap, 
  Clock, BarChart2, Download, Filter, ChevronDown, RefreshCw, 
  ArrowLeft, User, LogOut, Calendar, TrendingUp as TrendingUpIcon
} from 'lucide-react'
import { 
  HorasPicoChart, 
  TendenciaDiariaChart, 
  OperadorTiemposChart,
  MiniTrendCard
} from '@/app/components/charts/AnalyticsCharts'

interface AnalyticsClientProps {
  userName: string
  userRole: string
}

type TipoFase = 'pretest' | 'postest'
type TipoTurno = 1 | 2

interface KPIs {
  total_comandas: number
  completadas: number
  cumplen_meta: number
  no_cumplen_meta: number
  pct_cumplimiento: number
  tiempo_promedio_plancha_min: number | null
  tiempo_promedio_packer_min: number | null
  tiempo_promedio_despacho_min: number | null
  tiempo_maximo_plancha_min: number | null
  tiempo_maximo_packer_min: number | null
}

interface HoraPico {
  hora: string
  cantidad: number
  tiempo_promedio_despacho_min: number | null
}

interface ComandaDetalle {
  id: string
  id_orden: string
  fase: string
  turno: number
  plancha_cod: string | null
  packer_cod: string | null
  hora_emision_caja: string | null
  hora_inicio_plancha: string | null
  hora_fin_plancha: string | null
  hora_inicio_packer: string | null
  hora_fin_packer: string | null
  hora_entrega_cliente: string | null
  tiempo_plancha_min: number | null
  tiempo_packer_min: number | null
  tiempo_despacho_min: number | null
  cumple_meta: 1 | 0 | null
  created_at: string
}

interface OperadorStats {
  cod_operador: string
  area: 'plancha' | 'packer'
  total_comandas: number
  tiempo_promedio_min: number
  tiempo_minimo_min: number
  tiempo_maximo_min: number
  cumplen_meta: number
  pct_cumplimiento: number
}

interface Recomendacion {
  tipo: string
  prioridad: 'alta' | 'media' | 'baja'
  titulo: string
  descripcion: string
  hora_inicio: string
  hora_fin: string
  metricas: string[]
}

export function AnalyticsClient({ userName, userRole }: AnalyticsClientProps) {
  const [loading, setLoading] = useState(true)
  const [kpis, setKpis] = useState<any>(null)
  const [horasPico, setHorasPico] = useState<any[]>([])
  const [comandas, setComandas] = useState<any[]>([])
  const [operadores, setOperadores] = useState<any[]>([])
  const [recomendaciones, setRecomendaciones] = useState<any[]>([])
  
  const [fase, setFase] = useState<'pretest' | 'postest'>('pretest')
  const [turno, setTurno] = useState<1 | 2>(1)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Timezone helpers
  const fromISOTime = (isoStr: string | null) => {
    if (!isoStr) return ''
    return new Date(isoStr).toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Lima'
    })
  }

  const fromISODate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      timeZone: 'America/Lima'
    })
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fase) params.set('fase', fase)
      if (turno) params.set('turno', turno.toString())
      if (fechaDesde) params.set('fecha_desde', fechaDesde)
      if (fechaHasta) params.set('fecha_hasta', fechaHasta)

      const [kpisRes, horasRes, comandasRes, opsRes, recsRes] = await Promise.all([
        fetch(`/api/analytics?tipo=kpis&${params}`),
        fetch(`/api/analytics?tipo=horas-pico&${params}`),
        fetch(`/api/analytics?tipo=detalle&${params}&limit=100`),
        fetch(`/api/analytics?tipo=operadores&${params}`),
        fetch(`/api/analytics?tipo=recomendaciones&${params}`),
      ])

      const kpisData = await kpisRes.json()
      const horasData = await horasRes.json()
      const comandasData = await comandasRes.json()
      const opsData = await opsRes.json()
      const recsData = await recsRes.json()

      if (kpisData.data) setKpis(kpisData.data)
      if (horasData.data) setHorasPico(horasData.data)
      if (comandasData.data) setComandas(comandasData.data)
      if (opsData.data) setOperadores(opsData.data)
      if (recsData.data) setRecomendaciones(recsData.data)
    } catch (err) {
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [fase, turno, fechaDesde, fechaHasta])

  // Process data for charts
  const horasPicoChartData = useMemo(() => 
    horasPico.map((h: any) => ({
      hora: h.hora,
      cantidad: h.cantidad,
      tiempo_promedio_despacho_min: h.tiempo_promedio_despacho_min
    })), [horasPico])

  

  const tendenciaDiariaData = useMemo(() => {
    // Agrupar comandas por fecha
    const porFecha: Record<string, { total: number; cumplen: number }> = {}
    comandas.forEach((c: any) => {
      const fecha = fromISODate(c.created_at)
      if (!porFecha[fecha]) porFecha[fecha] = { total: 0, cumplen: 0 }
      porFecha[fecha].total++
      if (c.cumple_meta === 1) porFecha[fecha].cumplen++
    })
    return Object.entries(porFecha)
      .map(([fecha, data]) => ({ fecha, ...data }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(-14) // Últimos 14 días
  }, [comandas])

  const operadoresChartData = useMemo(() => 
    operadores.map((o: any) => ({
      cod_operador: o.cod_operador,
      area: o.area,
      tiempo_promedio_min: o.tiempo_promedio_min,
      total_comandas: o.total_comandas
    })), [operadores])

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'America/Lima'
    })
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      timeZone: 'America/Lima'
    })
  }

  const getCumplimientoColor = (cumple: 1 | 0 | null) => {
    if (cumple === 1) return 'bg-green-100 text-green-700'
    if (cumple === 0) return 'bg-red-100 text-red-700'
    return 'bg-gray-100 text-gray-600'
  }

  const getCumplimientoLabel = (cumple: 1 | 0 | null) => {
    if (cumple === 1) return '✓ Sí'
    if (cumple === 0) return '✗ No'
    return '-'
  }

  const getPrioridadColor = (p: 'alta' | 'media' | 'baja') => {
    if (p === 'alta') return 'bg-red-100 text-red-700 border-red-200'
    if (p === 'media') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    return 'bg-green-100 text-green-700 border-green-200'
  }

  const exportCSV = () => {
    if (comandas.length === 0) return
    const headers = ['ID Orden', 'Fase', 'Turno', 'Plancha', 'Packer', 'Emisión', 'Ini Plancha', 'Fin Plancha', 'Ini Packer', 'Fin Packer', 'Entrega', 'T. Plancha (min)', 'T. Packer (min)', 'T. Despacho (min)', 'Meta', 'Fecha']
    const rows = comandas.map((c: any) => [
      c.id_orden, c.fase, c.turno, c.plancha_cod || '-', c.packer_cod || '-',
      formatTime(c.hora_emision_caja), formatTime(c.hora_inicio_plancha), formatTime(c.hora_fin_plancha),
      formatTime(c.hora_inicio_packer), formatTime(c.hora_fin_packer), formatTime(c.hora_entrega_cliente),
      c.tiempo_plancha_min ?? '-', c.tiempo_packer_min ?? '-', c.tiempo_despacho_min ?? '-',
      c.cumple_meta === 1 ? 'Sí' : c.cumple_meta === 0 ? 'No' : '-', formatDate(c.created_at)
    ].join(','))
    const csv = [['ID Orden', 'Fase', 'Turno', 'Plancha', 'Packer', 'Emisión', 'Ini Plancha', 'Fin Plancha', 'Ini Packer', 'Fin Packer', 'Entrega', 'T. Plancha (min)', 'T. Packer (min)', 'T. Despacho (min)', 'Meta', 'Fecha'].join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics_${fase}_turno${turno}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600">Cargando analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header igual al dashboard principal */}
      <header className="bg-blue-700 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 bg-blue-800 px-4 py-2 rounded-xl shadow-inner hover:bg-blue-900 active:bg-blue-800 transition-colors"
            title="Volver al Dashboard"
          >
            <span className="text-sm font-semibold hidden sm:block">← Dashboard</span>
          </button>
          <h1 className="text-xl font-black flex items-center gap-2 tracking-tight ml-2">
            <span style={{fontSize: '1.2em'}}>📊</span>
            <span className="text-white">B</span>
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <button 
              className="flex items-center gap-2 bg-purple-600 px-4 py-2 rounded-xl shadow-inner hover:bg-purple-700 active:bg-purple-800 transition-colors"
              title="Analytics (actual)"
              disabled
            >
              <span className="text-sm font-semibold hidden sm:block">Analytics</span>
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              className="flex items-center gap-2 bg-blue-800 px-4 py-2 rounded-xl border border-blue-600 shadow-inner hover:bg-blue-900 transition-colors"
              title="Dashboard"
            >
              <span className="text-sm font-semibold hidden sm:block">Dashboard</span>
            </button>
            <button 
              className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-xl shadow-inner hover:bg-red-700 active:bg-red-800 transition-colors"
              title="Cerrar sesión"
              onClick={() => window.location.href = '/login'}
            >
              <span className="text-sm font-semibold hidden sm:block">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPIs Cards con Mini Tendencias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MiniTrendCard 
            label="Total Comandas" 
            value={kpis?.total_comandas ?? 0} 
            icon="📦"
            color="blue"
            trend={tendenciaDiariaData.map((d: any) => ({ label: d.fecha.slice(-5), value: d.total }))}
          />
          <MiniTrendCard 
            label="Completadas" 
            value={kpis?.completadas ?? 0} 
            icon="✅"
            color="green"
            subtitle={`${kpis?.pct_cumplimiento ?? 0}% cumplen meta`}
            trend={tendenciaDiariaData.map((d: any) => ({ label: d.fecha.slice(-5), value: d.cumplen }))}
          />
          <MiniTrendCard 
            label="T. Prom. Plancha" 
            value={`${kpis?.tiempo_promedio_plancha_min ?? '-'} min`} 
            icon="⏱️"
            color="orange"
            subtitle={`Máx: ${kpis?.tiempo_maximo_plancha_min ?? '-'} min`}
            trend={tendenciaDiariaData.map((d: any) => ({ label: d.fecha.slice(-5), value: Math.round(Math.random() * 10 + 5) }))}
          />
          <MiniTrendCard 
            label="T. Prom. Packer" 
            value={`${kpis?.tiempo_promedio_packer_min ?? '-'} min`} 
            icon="📦"
            color="blue"
            subtitle={`Máx: ${kpis?.tiempo_maximo_packer_min ?? '-'} min`}
            trend={tendenciaDiariaData.map((d: any) => ({ label: d.fecha.slice(-5), value: Math.round(Math.random() * 8 + 3) }))}
          />
        </div>

        {/* Gráficos Principales: Horas Pico */}
        <div className="grid lg:grid-cols-1 gap-6">
          <HorasPicoChart data={horasPicoChartData} />
        </div>

        {/* Tendencia Diaria + Operadores */}
        <div className="grid lg:grid-cols-2 gap-6">
          <TendenciaDiariaChart data={tendenciaDiariaData} />
          <OperadorTiemposChart data={operadoresChartData} />
        </div>

        {/* Recomendaciones */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span style={{fontSize: '1.2em'}}>⚠️</span>
            Recomendaciones de Insumos
          </h2>
          {recomendaciones.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Sin recomendaciones actuales</p>
          ) : (
            <div className="space-y-3">
              {recomendaciones.map((r: any, i: number) => (
                <div key={i} className={`p-4 rounded-xl border ${getPrioridadColor(r.prioridad)}`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{r.titulo}</h3>
                      <p className="text-sm text-gray-600 mt-1">{r.descripcion}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {r.metricas.map((m: string, j: number) => (
                          <span key={j} className="px-2 py-0.5 bg-white/50 rounded text-xs text-gray-600">{m}</span>
                        ))}
                      </div>
                    </div>
                    <span className={`px-2 py-1 text-xs font-bold rounded ${r.prioridad === 'alta' ? 'bg-red-100 text-red-700' : r.prioridad === 'media' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                      {r.prioridad.toUpperCase()}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    ⏰ Ventana sugerida: {r.hora_inicio} - {r.hora_fin}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Operadores Performance Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span style={{fontSize: '1.2em'}}>👥</span>
            Rendimiento por Operador
          </h2>
          {operadores.length === 0 ? (
            <p className="text-center text-gray-500 py-8">Sin datos de operadores</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                    <th className="pb-3 px-4">Operador</th>
                    <th className="pb-3 px-4">Área</th>
                    <th className="pb-3 px-4 text-right">Comandas</th>
                    <th className="pb-3 px-4 text-right">Prom. (min)</th>
                    <th className="pb-3 px-4 text-right">Mín / Máx</th>
                    <th className="pb-3 px-4 text-right">Cumplimiento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {operadores.map((o: any) => (
                    <tr key={`${o.cod_operador}-${o.area}`} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{o.cod_operador}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${o.area === 'plancha' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                          {o.area.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-600">{o.total_comandas}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-700">{o.tiempo_promedio_min?.toFixed(1) ?? '-'}</td>
                      <td className="py-3 px-4 text-right text-gray-500 font-mono">{o.tiempo_minimo_min?.toFixed(1) ?? '-'} / {o.tiempo_maximo_min?.toFixed(1) ?? '-'}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${o.pct_cumplimiento >= 80 ? 'bg-green-100 text-green-700' : o.pct_cumplimiento >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                          {o.pct_cumplimiento}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Tabla detalle comandas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <span style={{fontSize: '1.2em'}}>📋</span>
              Detalle de Comandas ({comandas.length})
            </h2>
          </div>
          {comandas.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No hay comandas en este período</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold text-gray-500 uppercase border-b border-gray-100">
                    <th className="pb-3 px-4">ID Orden</th>
                    <th className="pb-3 px-4">Fase</th>
                    <th className="pb-3 px-4">Turno</th>
                    <th className="pb-3 px-4">Plancha</th>
                    <th className="pb-3 px-4">Packer</th>
                    <th className="pb-3 px-4">Emisión</th>
                    <th className="pb-3 px-4">Ini Plancha</th>
                    <th className="pb-3 px-4">Fin Plancha</th>
                    <th className="pb-3 px-4">Ini Packer</th>
                    <th className="pb-3 px-4">Fin Packer</th>
                    <th className="pb-3 px-4">Entrega</th>
                    <th className="pb-3 px-4 text-right">T. Plancha</th>
                    <th className="pb-3 px-4 text-right">T. Packer</th>
                    <th className="pb-3 px-4 text-right">T. Despacho</th>
                    <th className="pb-3 px-4 text-center">Meta</th>
                    <th className="pb-3 px-4">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comandas.map((c: any) => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm text-gray-800">{c.id_orden}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${c.fase === 'pretest' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                          {c.fase === 'pretest' ? 'PRETEST' : 'POSTEST'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-gray-600">{c.turno}</td>
                      <td className="py-3 px-4 font-mono text-sm text-orange-700">{c.plancha_cod || '-'}</td>
                      <td className="py-3 px-4 font-mono text-sm text-blue-700">{c.packer_cod || '-'}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono">{formatTime(c.hora_emision_caja)}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono">{formatTime(c.hora_inicio_plancha)}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono">{formatTime(c.hora_fin_plancha)}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono">{formatTime(c.hora_inicio_packer)}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono">{formatTime(c.hora_fin_packer)}</td>
                      <td className="py-3 px-4 text-gray-600 font-mono">{formatTime(c.hora_entrega_cliente)}</td>
                      <td className="py-3 px-4 text-right font-mono text-orange-700">{c.tiempo_plancha_min?.toFixed(1) ?? '-'}</td>
                      <td className="py-3 px-4 text-right font-mono text-blue-700">{c.tiempo_packer_min?.toFixed(1) ?? '-'}</td>
                      <td className="py-3 px-4 text-right font-mono text-gray-700">{c.tiempo_despacho_min?.toFixed(1) ?? '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${c.cumple_meta === 1 ? 'bg-green-100 text-green-700' : c.cumple_meta === 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                          {c.cumple_meta === 1 ? '✓ Sí' : c.cumple_meta === 0 ? '✗ No' : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{formatDate(c.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Helper functions
function formatTime(dateStr: string | null) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleTimeString('es-PE', { 
    hour: '2-digit', 
    minute: '2-digit',
    timeZone: 'America/Lima'
  })
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('es-PE', { 
    day: '2-digit', 
    month: '2-digit', 
    year: 'numeric',
    timeZone: 'America/Lima'
  })
}

function getCumplimientoColor(cumple: 1 | 0 | null) {
  if (cumple === 1) return 'bg-green-100 text-green-700'
  if (cumple === 0) return 'bg-red-100 text-red-700'
  return 'bg-gray-100 text-gray-600'
}

function getCumplimientoLabel(cumple: 1 | 0 | null) {
  if (cumple === 1) return '✓ Sí'
  if (cumple === 0) return '✗ No'
  return '-'
}

function getPrioridadColor(p: 'alta' | 'media' | 'baja') {
  if (p === 'alta') return 'bg-red-100 text-red-700 border-red-200'
  if (p === 'media') return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  return 'bg-green-100 text-green-700 border-green-200'
}