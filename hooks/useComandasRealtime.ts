'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { Comanda } from '@/types/database'

type RealtimePayload = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Comanda | null
  old: Comanda | null
}

export function useComandasRealtime<T extends Comanda = Comanda>(initialData: T[] = []) {
  const [comandas, setComandas] = useState<T[]>(initialData)
  const [isConnected, setIsConnected] = useState(false)
  
  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
    
    // Suscribirse a cambios en la tabla comandas
    const channel = supabase
      .channel('comandas-changes')
      .on(
        'postgres_changes' as any,
        {
          event: '*',
          schema: 'public',
          table: 'comandas',
        },
        (payload: RealtimePayload) => {
          console.log('[Realtime] Cambio en comandas:', payload.eventType, payload.new?.id_orden)
          
          setComandas(prev => {
            switch (payload.eventType) {
              case 'INSERT':
                if (payload.new) {
                  return [payload.new as unknown as T, ...prev]
                }
                return prev
                
              case 'UPDATE':
                if (payload.new) {
                  return prev.map(c => c.id === payload.new!.id ? payload.new as unknown as T : c)
                }
                return prev
                
              case 'DELETE':
                if (payload.old) {
                  return prev.filter(c => c.id !== payload.old!.id)
                }
                return prev
                
              default:
                return prev
            }
          })
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
        console.log('[Realtime] Estado de suscripción:', status)
      })
    
    return () => {
      supabase.removeChannel(channel)
      setIsConnected(false)
    }
  }, [])
  
  const updateLocal = useCallback((id: string, updates: Partial<T>) => {
    setComandas(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }, [])
  
  const addLocal = useCallback((comanda: T) => {
    setComandas(prev => [comanda, ...prev])
  }, [])
  
  const removeLocal = useCallback((id: string) => {
    setComandas(prev => prev.filter(c => c.id !== id))
  }, [])
  
  return { comandas, isConnected, updateLocal, addLocal, removeLocal, setComandas }
}