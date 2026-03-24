import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSessionByToken } from '../services/sessionService'
import { createParticipant } from '../services/participantService'
import { generateTeams } from '../services/teamService'
import { LABELS } from '../constants'
import type { Session } from '../types'
import ScoreWidget from '../components/ui/ScoreWidget'
import Button from '../components/ui/Button'

export default function JoinPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [scoreCopilot, setScoreCopilot] = useState(0)
  const [scoreMia, setScoreMia] = useState(0)
  const [service, setService] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    if (!token) return
    // Check if already joined
    const existingToken = localStorage.getItem(`eq_participant_${token}`)
    if (existingToken) {
      navigate(`/waiting/${token}`, { replace: true })
      return
    }
    getSessionByToken(token).then((s) => {
      setSession(s)
      setLoading(false)
    })
  }, [token, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!session || !token) return

    const participant = await createParticipant({
      sessionId: session.id,
      name,
      service,
      scoreCopilot,
      scoreMia,
    })

    // Save participant token in localStorage
    localStorage.setItem(`eq_participant_${token}`, participant.sessionToken)
    localStorage.setItem(`eq_participant_id_${token}`, participant.id)

    // Auto-assign teams
    await generateTeams(session.id, session.numTeams)

    navigate(`/waiting/${token}`, { replace: true })
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Session introuvable.</p>
      </div>
    )
  }

  if (session.status !== 'open') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--color-text-muted)]">{LABELS.sessionClosed}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-center">
        {session.title}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {/* Copilot score */}
        <div>
          <label className="block text-sm font-medium">{LABELS.copilotLabel}</label>
          <p className="text-xs text-[var(--color-text-muted)]">{LABELS.copilotHelp}</p>
          <ScoreWidget value={scoreCopilot} onChange={setScoreCopilot} />
        </div>

        {/* Mia score */}
        <div>
          <label className="block text-sm font-medium">{LABELS.miaLabel}</label>
          <p className="text-xs text-[var(--color-text-muted)]">{LABELS.copilotHelp}</p>
          <ScoreWidget value={scoreMia} onChange={setScoreMia} />
        </div>

        {/* Service */}
        <div>
          <label className="block text-sm font-medium">{LABELS.serviceLabel}</label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
          >
            <option value="">— Choisir —</option>
            {session.services.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Nom */}
        <div>
          <label className="block text-sm font-medium">{LABELS.nameLabel}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={LABELS.namePlaceholder}
            required
            autoFocus
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
          />
        </div>

        <Button type="submit" className="w-full py-3">
          {LABELS.validate}
        </Button>
      </form>
    </div>
  )
}
