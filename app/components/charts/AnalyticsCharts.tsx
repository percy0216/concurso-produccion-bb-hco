'use client'

import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartOptions,
} from 'chart.js'
import { Bar, Line, Doughnut } from 'react-chartjs-2'
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

// ============================================================
// GRÁFICO 1: Barras - Horas Pico (Afluencia por hora)
// ============================================================
interface HorasPicoChartProps {
  data: Array<{ hora: string; cantidad: number; tiempo_promedio_despacho_min: number | null }>
}

export function HorasPicoChart({ data }: HorasPicoChartProps) {
  const chartData = useMemo<any>(() => ({
    labels: data.map(d => d.hora),
    datasets: [
      {
        label: 'Comandas por hora',
        data: data.map(d => d.cantidad),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      },
      {
        label: 'Tiempo prom. despacho (min)',
        data: data.map(d => d.tiempo_promedio_despacho_min ?? 0),
        type: 'line' as const,
        yAxisID: 'y1',
        borderColor: 'rgb(239, 68, 68)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        borderWidth: 2,
        fill: false,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(239, 68, 68)',
      },
    ],
  }), [data])

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            if (context.datasetIndex === 0) {
              return `${context.dataset.label}: ${context.raw} comandas`
            }
            return `${context.dataset.label}: ${context.raw.toFixed(1)} min`
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        beginAtZero: true,
        title: { display: true, text: 'N° Comandas' },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
      y1: {
        type: 'linear',
        position: 'right',
        beginAtZero: true,
        title: { display: true, text: 'Tiempo prom. (min)' },
        grid: { drawOnChartArea: false },
      },
      x: { grid: { display: false } },
    },
  }

  if (!data.length) return <div className="text-center text-gray-500 py-8">Sin datos de horas pico</div>

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span style={{fontSize: '1.2em'}}>📊</span>
        Horas Pico: Afluencia vs Tiempo de Despacho
      </h3>
      <div style={{height: '300px'}}>
        <Bar data={chartData} options={options} />
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">
        Barras = Comandas por hora | Línea roja = Tiempo promedio de despacho (min)
      </p>
    </div>
  )
}

// ============================================================
// GRÁFICO 2: Doughnut - Cumplimiento Meta (Sí/No)
// ============================================================
interface MetaChartProps {
  cumplen: number
  noCumplen: number
  incompletas: number
}

export function MetaChart({ cumplen, noCumplen, incompletas }: MetaChartProps) {
  const chartData = useMemo(() => ({
    labels: ['✓ Cumple (≤8 min)', '✗ No cumple (>8 min)', '⏳ Incompletas'],
    datasets: [{
      data: [cumplen, noCumplen, incompletas],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(239, 68, 68, 0.8)', 
        'rgba(156, 163, 175, 0.8)'
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(239, 68, 68)',
        'rgb(156, 163, 175)'
      ],
      borderWidth: 2,
      cutout: '60%',
    }]
  }), [cumplen, noCumplen, incompletas])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' as const, labels: { padding: 16, font: { size: 12 } } },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0)
            const pct = total > 0 ? ((context.raw / total) * 100).toFixed(1) : 0
            return `${context.label}: ${context.raw} (${pct}%)`
          }
        }
      }
    },
    cutout: '60%',
  }

  const total = cumplen + noCumplen + incompletas
  if (!total) return <div className="text-center text-gray-500 py-8">Sin datos de cumplimiento</div>

  const pctCumplen = ((cumplen / total) * 100).toFixed(1)

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span style={{fontSize: '1.2em'}}>🎯</span>
        Cumplimiento de Meta (≤8 min)
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div style={{height: '280px'}}>
          <Doughnut data={chartData} options={options} />
        </div>
        <div className="flex flex-col justify-center gap-4">
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-4xl font-bold text-green-600">{pctCumplen}%</p>
            <p className="text-sm text-gray-500">Cumplimiento Global</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-green-50 rounded-xl border border-green-100">
              <p className="text-2xl font-bold text-green-600">{cumplen}</p>
              <p className="text-xs text-green-700">✓ Cumplen (≤8 min)</p>
            </div>
            <div className="p-3 bg-red-50 rounded-xl border border-red-100">
              <p className="text-2xl font-bold text-red-600">{noCumplen}</p>
              <p className="text-xs text-red-700">✗ No cumplen (menor a 8 min)</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-2xl font-bold text-gray-500">{incompletas}</p>
              <p className="text-xs text-gray-600">⏳ Incompletas</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// GRÁFICO 3: Línea - Tendencia Diaria (Comandas por día)
// ============================================================
interface TendenciaDiariaProps {
  data: Array<{ fecha: string; total: number; cumplen: number }>
}

export function TendenciaDiariaChart({ data }: TendenciaDiariaProps) {
  const chartData = useMemo(() => ({
    labels: data.map(d => d.fecha),
    datasets: [
      {
        label: 'Total Comandas',
        data: data.map(d => d.total),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(59, 130, 246)',
      },
      {
        label: 'Cumplen Meta',
        data: data.map(d => d.cumplen),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        borderWidth: 2,
        fill: true,
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
      },
    ],
  }), [data])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: { legend: { position: 'top' as const } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'N° Comandas' }, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  }

  if (!data.length) return <div className="text-center text-gray-500 py-8">Sin datos de tendencia</div>

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span style={{fontSize: '1.2em'}}>📈</span>
        Tendencia Diaria: Total vs Cumplimiento
      </h3>
      <div style={{height: '280px'}}>
        <Line data={chartData} options={options} />
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">
        Línea azul = Total comandas/día | Línea verde = Cumplen meta/día
      </p>
    </div>
  )
}

// ============================================================
// GRÁFICO 4: Barras apiladas - Plancha vs Packer por operador
// ============================================================
interface OperadorTiemposProps {
  data: Array<{ 
    cod_operador: string; 
    area: 'plancha' | 'packer'; 
    tiempo_promedio_min: number;
    total_comandas: number;
  }>
}

export function OperadorTiemposChart({ data }: OperadorTiemposProps) {
  const planchaData = data.filter(d => d.area === 'plancha').sort((a,b) => b.tiempo_promedio_min - a.tiempo_promedio_min)
  const packerData = data.filter(d => d.area === 'packer').sort((a,b) => b.tiempo_promedio_min - a.tiempo_promedio_min)

  const chartData = useMemo(() => ({
    labels: [...planchaData.map(d => d.cod_operador), ...packerData.map(d => d.cod_operador)],
    datasets: [
      {
        label: 'Plancha (min)',
        data: [...planchaData.map(d => d.tiempo_promedio_min), ...packerData.map(d => 0)],
        backgroundColor: 'rgba(249, 115, 22, 0.8)',
        borderColor: 'rgb(249, 115, 22)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Packer (min)',
        data: [...planchaData.map(d => 0), ...packerData.map(d => d.tiempo_promedio_min)],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  }), [data])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'top' as const } },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Tiempo Promedio (min)' }, grid: { color: 'rgba(0,0,0,0.05)' } },
      x: { grid: { display: false } },
    },
  }

  if (!data.length) return <div className="text-center text-gray-500 py-8">Sin datos de operadores</div>

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
        <span style={{fontSize: '1.2em'}}>⏱️</span>
        Tiempos Promedio por Operador
      </h3>
      <div style={{height: '280px'}}>
        <Bar data={chartData} options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'top' as const } },
          scales: {
            y: { beginAtZero: true, title: { display: true, text: 'Tiempo Promedio (min)' }, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } },
          },
        }} />
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center">
        Naranja = Plancha | Azul = Packer | Meta ≤ 8 min (línea punteada)
      </p>
    </div>
  )
}

// ============================================================
// GRÁFICO 5: KPI Card con mini tendencia (Sparkline)
// ============================================================
interface MiniTrendProps {
  label: string
  value: string | number
  trend: Array<{ label: string; value: number }>
  color: 'blue' | 'green' | 'orange' | 'red'
  icon: string
  subtitle?: string
}

export function MiniTrendCard({ label, value, trend, color, icon, subtitle }: MiniTrendProps) {
  const colors = {
    blue: 'bg-blue-100 text-blue-600 border-blue-200',
    green: 'bg-green-100 text-green-600 border-green-200',
    orange: 'bg-orange-100 text-orange-600 border-orange-200',
    red: 'bg-red-100 text-red-600 border-red-200',
  }

  const trendColors = {
    blue: { border: 'rgb(59, 130, 246)', bg: 'rgba(59, 130, 246, 0.1)' },
    green: { border: 'rgb(34, 197, 94)', bg: 'rgba(34, 197, 94, 0.1)' },
    orange: { border: 'rgb(249, 115, 22)', bg: 'rgba(249, 115, 22, 0.1)' },
    red: { border: 'rgb(239, 68, 68)', bg: 'rgba(239, 68, 68, 0.1)' },
  }

  const c = trendColors[color]
  const chartData = useMemo(() => ({
    labels: trend.map(t => t.label),
    datasets: [{
      data: trend.map(t => t.value),
      borderColor: c.border,
      backgroundColor: c.bg,
      borderWidth: 2,
      fill: true,
      tension: 0.3,
      pointRadius: 0,
    }]
  }), [trend])

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { point: { radius: 0 } },
  }

  return (
    <div className={`bg-white rounded-2xl shadow-sm border ${colors[color].replace('bg-', 'border-')} p-5`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
          <p className="mt-2 text-2xl font-bold text-gray-800">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-gray-500">{subtitle}</p>}
          <div className="mt-2 h-16" style={{width: '100%'}}>
            <Line data={chartData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false }, tooltip: { enabled: false } },
              scales: { x: { display: false }, y: { display: false } },
              elements: { point: { radius: 0 }, line: { tension: 0.3 } },
            }} />
          </div>
        </div>
        <div className={`p-3 rounded-xl ${colors[color]}`}>
          <span style={{fontSize: '1.5em'}}>{icon}</span>
        </div>
      </div>
    </div>
  )
}