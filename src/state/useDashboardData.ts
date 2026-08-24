import { useCallback, useEffect, useRef, useState } from 'react'
import { loadData, saveData } from '../lib/api'
import { createDefaultData } from '../lib/defaultData'
import type { DashboardData } from '../types'

export type SyncStatus = 'loading' | 'idle' | 'saving' | 'saved' | 'error'

const SAVE_DEBOUNCE_MS = 800

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [status, setStatus] = useState<SyncStatus>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const saveTimeout = useRef<number | undefined>(undefined)
  const skipNextSave = useRef(true)

  useEffect(() => {
    let cancelled = false
    loadData()
      .then((loaded) => {
        if (cancelled) return
        setData(loaded ?? createDefaultData())
        setStatus('idle')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setErrorMessage(err instanceof Error ? err.message : String(err))
        setData(createDefaultData())
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (data === null) return
    if (skipNextSave.current) {
      skipNextSave.current = false
      return
    }
    if (saveTimeout.current) window.clearTimeout(saveTimeout.current)
    saveTimeout.current = window.setTimeout(() => {
      setStatus('saving')
      saveData(data)
        .then(() => setStatus('saved'))
        .catch((err: unknown) => {
          setErrorMessage(err instanceof Error ? err.message : String(err))
          setStatus('error')
        })
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimeout.current) window.clearTimeout(saveTimeout.current)
    }
  }, [data])

  const update = useCallback((updater: (prev: DashboardData) => DashboardData) => {
    setData((prev) => (prev ? updater(prev) : prev))
  }, [])

  return { data, status, errorMessage, update }
}
