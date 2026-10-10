'use client'

import { Clock, Flame, Package, Save, Loader2 } from 'lucide-react'
import type { StationCardProps } from './types'

export function StationCard({ 
  title, 
  icon: Icon, 
  colorClass, 
  borderClass, 
  collab, 
  setCollab, 
  start, 
  setStart, 
  end, 
  setEnd, 
  onSave,
  operadores,
  saving = false
}: StationCardProps & { saving?: boolean }) {
  const getCurrentTime = () => {
    const now = new Date()
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className={`bg-white p-5 rounded-2xl shadow-md border-t-8 ${borderClass} flex flex-col gap-5`}>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${colorClass} text-white shadow-sm`}>
          <Icon size={26} />
        </div>
        <h2 className="text-2xl font-black text-gray-800 tracking-tight">{title}</h2>
      </div>

      <select 
        value={collab} 
        onChange={(e) => setCollab(e.target.value)} 
        className="w-full p-4 bg-gray-50 rounded-xl font-black text-gray-800 text-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none appearance-none shadow-sm"
      >
        <option value="">👤 SELECCIONAR...</option>
        {operadores.map(c => <option key={c.cod_operador} value={c.cod_operador}>{c.cod_operador}</option>)}
      </select>

      <div className="flex flex-col gap-4">
        {/* Input Sale Comanda */}
        <div>
          <label className="text-sm font-black text-gray-500 ml-1 uppercase tracking-wider block mb-1">Sale Comanda</label>
          <div className="flex bg-white border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 shadow-inner">
            <input 
              type="time" 
              value={start} 
              onChange={(e) => setStart(e.target.value)} 
              className="w-full bg-transparent p-3 font-black text-2xl text-center outline-none text-gray-800 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none" 
            />
            <button 
              onClick={() => setStart(getCurrentTime())} 
              className="px-6 bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300 font-bold border-l-2 border-gray-200 flex items-center justify-center transition-colors"
            >
              <Clock size={26} />
            </button>
          </div>
        </div>

        {/* Input Entrega */}
        <div>
          <label className="text-sm font-black text-gray-500 ml-1 uppercase tracking-wider block mb-1">Entrega</label>
          <div className="flex bg-white border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-blue-500 shadow-inner">
            <input 
              type="time" 
              value={end} 
              onChange={(e) => setEnd(e.target.value)} 
              className="w-full bg-transparent p-3 font-black text-2xl text-center outline-none text-gray-800 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none" 
            />
            <button 
              onClick={() => setEnd(getCurrentTime())} 
              className="px-6 bg-blue-100 text-blue-700 hover:bg-blue-200 active:bg-blue-300 font-bold border-l-2 border-gray-200 flex items-center justify-center transition-colors"
            >
              <Clock size={26} />
            </button>
          </div>
        </div>
      </div>

      <button 
        onClick={onSave} 
        disabled={saving}
        className={`mt-2 w-full flex justify-center items-center gap-2 shadow-lg active:scale-[0.98] transition-transform font-black text-xl p-5 rounded-xl ${
          saving 
            ? 'bg-green-500 cursor-wait' 
            : 'bg-green-600 active:bg-green-700'
        }`}
      >
        {saving ? <Loader2 size={28} className="animate-spin" /> : <Save size={28} />}
        {saving ? 'GUARDANDO...' : `GUARDAR ${title}`}
      </button>
    </div>
  )
}