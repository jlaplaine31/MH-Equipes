import { useState, useCallback } from 'react'
import type { Session, Participant, Team } from '../types'
import { getSession } from '../services/sessionService'
import { getParticipants } from '../services/participantService'
import { getTeams, generateTeams, resetTeams } from '../services/teamService'
import { usePolling } from './usePolling'

interface SessionData {
  session: Session | null
  participants: Participant[]
  teams: Team[]
  loading: boolean
  refresh: () => Promise<void>
  rebalance: (numTeams: number) => Promise<void>
  reset: () => Promise<void>
}

/**
 * Hook qui charge et rafraichit les donnees d'une session par polling.
 */
export function useSessionData(sessionId: string | undefined): SessionData {
  const [session, setSession] = useState<Session | null>(null)
  const [participants, setParticipants] = useState<Participant[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!sessionId) return
    const [s, p, t] = await Promise.all([
      getSession(sessionId),
      getParticipants(sessionId),
      getTeams(sessionId),
    ])
    setSession(s)
    setParticipants(p)
    setTeams(t)
    setLoading(false)
  }, [sessionId])

  usePolling(refresh, 4000, !!sessionId)

  const rebalance = useCallback(async (numTeams: number) => {
    if (!sessionId) return
    const newTeams = await generateTeams(sessionId, numTeams)
    setTeams(newTeams)
  }, [sessionId])

  const reset = useCallback(async () => {
    if (!sessionId) return
    await resetTeams(sessionId)
    await refresh()
  }, [sessionId, refresh])

  return { session, participants, teams, loading, refresh, rebalance, reset }
}
