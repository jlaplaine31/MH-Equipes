import { useEffect, useRef } from 'react'
import { POLLING_INTERVAL_MS } from '../constants'

/**
 * Hook de polling generique.
 * Appelle `callback` toutes les `intervalMs` millisecondes.
 * S'arrete si `enabled` est false.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number = POLLING_INTERVAL_MS,
  enabled: boolean = true,
) {
  const savedCallback = useRef(callback)

  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  useEffect(() => {
    if (!enabled) return

    // Appel immediat
    savedCallback.current()

    const id = setInterval(() => {
      savedCallback.current()
    }, intervalMs)

    return () => clearInterval(id)
  }, [intervalMs, enabled])
}
