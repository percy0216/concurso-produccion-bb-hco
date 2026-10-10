'use client'

import { Timer, User, LogOut, Settings, BarChart2 } from 'lucide-react'

interface HeaderProps {
  baseTime: number
  setBaseTime: (value: number) => void
  userName: string
  onProfileClick: () => void
  onLogout: () => void
  onAnalyticsClick: () => void
}

export function Header({ baseTime, setBaseTime, userName, onProfileClick, onLogout, onAnalyticsClick }: HeaderProps) {
  return (
    <header className="bg-blue-700 text-white p-4 shadow-md sticky top-0 z-10 flex justify-between items-center">
      <h1 className="text-xl font-black flex items-center gap-2 tracking-tight">
        <Timer size={26} /> B
      </h1>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <button 
            onClick={onAnalyticsClick}
            className="flex items-center gap-2 bg-purple-600 px-4 py-2 rounded-xl shadow-inner hover:bg-purple-700 active:bg-purple-800 transition-colors"
            title="Ver Analytics"
          >
            <BarChart2 size={20} />
            <span className="text-sm font-semibold hidden sm:block">Analytics</span>
          </button>
          <button 
            onClick={onProfileClick}
            className="flex items-center gap-2 bg-blue-800 px-4 py-2 rounded-xl border border-blue-600 shadow-inner hover:bg-blue-900 transition-colors"
            title="Perfil"
          >
            <User size={20} />
            <span className="text-sm font-semibold hidden sm:block">{userName}</span>
          </button>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 bg-red-600 px-4 py-2 rounded-xl shadow-inner hover:bg-red-700 active:bg-red-800 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={20} />
            <span className="text-sm font-semibold hidden sm:block">Salir</span>
          </button>
        </div>
      </div>
    </header>
  )
}