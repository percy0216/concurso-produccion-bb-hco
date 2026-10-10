'use client'

import { useState } from 'react'
import { X, Settings } from 'lucide-react'

interface ProfileModalProps {
  show: boolean
  onClose: () => void
  userName: string
  onUpdateName: (name: string) => Promise<void>
}

export function ProfileModal({ show, onClose, userName, onUpdateName }: ProfileModalProps) {
  const [name, setName] = useState(userName)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (!name.trim()) {
      setError('El nombre es requerido')
      return
    }
    
    try {
      await onUpdateName(name.trim())
      setSuccess('Nombre actualizado correctamente')
      setTimeout(() => {
        setSuccess('')
        onClose()
      }, 2000)
    } catch (err) {
      setError('Error al actualizar')
    }
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-black text-gray-800 flex items-center gap-2">
            <Settings size={24} className="text-blue-600" />
            Perfil
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{error}</p>}
          {success && <p className="text-sm text-green-700 bg-green-50 rounded-lg p-2">{success}</p>}
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Correo electrónico</label>
            <input 
              type="email" 
              disabled
              className="w-full p-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-600 font-medium cursor-not-allowed"
              placeholder="No editable"
            />
          </div>
          
          <div>
            <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
            <input 
              id="name"
              name="name"
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none font-medium"
              placeholder="Tu nombre"
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl active:bg-gray-200 transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl active:bg-blue-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}