'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Trash2, Edit2, X, Check, Download, Timer, Flame, Package } from 'lucide-react'
import type { Registro, EditRegistroRowProps } from './types'

export function EditRegistroRow({ registro, onSave, onCancel, operadores, estaciones }: EditRegistroRowProps) {
  const [editData, setEditData] = useState(registro)

  return (
    <div className="bg-yellow-50 p-4 rounded-xl border-2 border-yellow-300 flex flex-col gap-3 shadow-sm">
      <div className="flex justify-between items-center mb-1">
        <span className="font-black text-yellow-800 text-sm uppercase">Modo Edición</span>
        <button onClick={onCancel} className="text-gray-500 active:text-gray-800 bg-white rounded-full p-1.5 shadow-sm"><X size={20}/></button>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <select value={editData.colaborador} onChange={e => setEditData({...editData, colaborador: e.target.value})} className="p-3 border-2 border-yellow-200 rounded-lg bg-white text-base font-black">
          {operadores.map((c: Pick<Operador, 'cod_operador'>) => <option key={c.cod_operador} value={c.cod_operador}>{c.cod_operador}</option>)}
        </select>
        <select value={editData.estacion} onChange={e => setEditData({...editData, estacion: e.target.value})} className="p-3 border-2 border-yellow-200 rounded-lg bg-white text-base font-black">
          {estaciones.map(e => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input type="time" value={editData.horaInicio} onChange={e => setEditData({...editData, horaInicio: e.target.value})} className="p-3 border-2 border-yellow-200 rounded-lg bg-white text-center font-black text-lg [&::-webkit-calendar-picker-indicator]:hidden" />
        <input type="time" value={editData.horaFin} onChange={e => setEditData({...editData, horaFin: e.target.value})} className="p-3 border-2 border-yellow-200 rounded-lg bg-white text-center font-black text-lg [&::-webkit-calendar-picker-indicator]:hidden" />
      </div>

      <button onClick={() => onSave(editData)} className="w-full bg-yellow-500 active:bg-yellow-600 text-white font-black py-4 rounded-lg flex justify-center items-center gap-2 text-lg shadow-sm">
        <Check size={24} /> Guardar Cambios
      </button>
    </div>
  )
}

import type { Operador } from '@/types/database'

interface RegistroListProps {
  registros: Registro[]
  baseTime: number
  editingId: string | null
  setEditingId: (id: string | null) => void
  onUpdateRegistro: (updatedRegistro: Registro) => void
  onDeleteRegistro: (id: string) => void
  onExportCSV: () => void
  onClearAll: () => void
  operadores: Pick<Operador, 'cod_operador'>[]
  estaciones: string[]
}

export function RegistroList({ 
  registros, 
  baseTime, 
  editingId, 
  setEditingId, 
  onUpdateRegistro, 
  onDeleteRegistro,
  onExportCSV,
  onClearAll,
  operadores,
  estaciones
}: RegistroListProps) {
  const calculateMinutes = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number)
    const [endH, endM] = end.split(':').map(Number)
    let diff = (endH * 60 + endM) - (startH * 60 + startM)
    if (diff < 0) diff += 24 * 60
    return diff
  }

  return (
    <section className="bg-white rounded-2xl shadow-md border border-gray-200 p-4">
      <div className="flex flex-wrap justify-between items-center mb-5 gap-2 border-b-2 border-gray-100 pb-4">
        <h2 className="text-xl font-black text-gray-800">Registros</h2>
        <div className="flex gap-2">
          {registros.length > 0 && (
            <>
              <button onClick={onExportCSV} className="bg-blue-100 text-blue-700 flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm active:bg-blue-200 transition-colors">
                <Download size={18} /> CSV
              </button>
              <button onClick={onClearAll} className="bg-red-100 text-red-600 flex items-center gap-2 px-4 py-2 rounded-xl font-black text-sm active:bg-red-200 transition-colors">
                <Trash2 size={18} /> Limpiar
              </button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
        {registros.length === 0 ? (
          <p className="text-center text-gray-400 py-10 font-bold text-lg">Sin registros. ¡A darle al rush!</p>
        ) : (
          registros.map((reg) => (
            editingId === reg.id ? (
              <EditRegistroRow 
                key={reg.id} 
                registro={reg} 
                onSave={onUpdateRegistro} 
                onCancel={() => setEditingId(null)}
                operadores={operadores}
                estaciones={estaciones}
              />
            ) : (
              <div key={reg.id} className="bg-white p-4 rounded-2xl border-2 border-gray-100 shadow-sm flex items-center justify-between gap-2">
                <div className="flex-1">
                  <h3 className="font-black text-xl text-gray-800 leading-none">{reg.colaborador}</h3>
                  <div className="flex gap-2 mt-2">
                    <span className={`text-xs font-black px-2 py-1 rounded-md uppercase ${reg.estacion === 'PLANCHA' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                      {reg.estacion}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 font-bold mt-2 tracking-widest">{reg.horaInicio} - {reg.horaFin}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-2">
                    <button onClick={() => setEditingId(reg.id)} className="p-2.5 bg-yellow-100 text-yellow-700 active:bg-yellow-200 rounded-xl transition-colors shadow-sm"><Edit2 size={18}/></button>
                    <button onClick={() => onDeleteRegistro(reg.id)} className="p-2.5 bg-red-100 text-red-700 active:bg-red-200 rounded-xl transition-colors shadow-sm"><Trash2 size={18}/></button>
                  </div>

                  <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-2xl shadow-inner ${reg.tiempoTotal <= baseTime ? 'bg-green-100' : 'bg-red-100'}`}>
                    <div className={`flex items-center font-black text-3xl leading-none ${reg.tiempoTotal <= baseTime ? 'text-green-700' : 'text-red-700'}`}>
                      {reg.tiempoTotal}
                    </div>
                    <span className={`text-xs font-black uppercase mt-1 ${reg.tiempoTotal <= baseTime ? 'text-green-600' : 'text-red-600'}`}>min</span>
                  </div>
                </div>
              </div>
            )
          ))
        )}
      </div>
    </section>
  )
}