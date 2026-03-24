import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getSessionByToken } from '../services/sessionService'
import { getParticipantByToken } from '../services/participantService'
import { getTeams } from '../services/teamService'
import { usePolling } from '../hooks/usePolling'
import { LABELS } from '../constants'
import type { Session, Participant, Team } from '../types'

export default function WaitingPage() {
  const { token } = useParams<{ token: string }>()
  const [session, setSession] = useState<Session | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [myTeam, setMyTeam] = useState<Team | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    const participantToken = localStorage.getItem(`eq_participant_${token}`)
    if (!participantToken) return

    Promise.all([
      getSessionByToken(token),
      getParticipantByToken(participantToken),
    ]).then(([s, p]) => {
      setSession(s)
      setParticipant(p)
      setLoading(false)
    })
  }, [token])

  const checkTeam = useCallback(async () => {
    if (!session || !participant) return
    const teams = await getTeams(session.id)
    const team = teams.find((t) =>
      t.members.some((m) => m.id === participant.id)
    )
    setMyTeam(team ?? null)
  }, [session, participant])

  usePolling(checkTeam, 3000, !!session && !!participant)

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <AnimatePresence mode="wait">
          {!myTeam ? (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="spinner mx-auto" />
              <h1 className="font-[family-name:var(--font-display)] mt-6 text-2xl font-bold">
                {LABELS.waitingTitle} {participant?.name} !
              </h1>
              <p className="mt-2 text-[var(--color-text-muted)]">
                {LABELS.waitingMessage}
              </p>
              <p className="mt-1 text-[var(--color-text-muted)]">
                {LABELS.waitingTeams}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="team"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              {/* Team badge */}
              <div
                className="mx-auto inline-block rounded-2xl px-8 py-4 text-white"
                style={{ backgroundColor: myTeam.color }}
              >
                <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold">
                  {myTeam.name}
                </h2>
              </div>

              {myTeam.tag && (
                <p className="mt-3 text-lg text-[var(--color-text-muted)]">
                  {myTeam.tag}
                </p>
              )}

              {/* Members list */}
              <div className="mt-6 space-y-2">
                {myTeam.members.map((member) => (
                  <div
                    key={member.id}
                    className={`rounded-lg px-4 py-2 text-sm ${
                      member.id === participant?.id
                        ? 'font-bold text-white'
                        : 'bg-[var(--color-card)] border border-[var(--color-border)]'
                    }`}
                    style={
                      member.id === participant?.id
                        ? { backgroundColor: myTeam.color }
                        : undefined
                    }
                  >
                    {member.name}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Link
          to={`/edit/${token}`}
          className="mt-8 inline-block text-sm text-[var(--color-accent-current)] underline"
        >
          {LABELS.editResponses}
        </Link>
      </div>
    </div>
  )
}
