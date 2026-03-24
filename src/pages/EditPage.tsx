import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getSessionByToken } from '../services/sessionService'
import { getParticipantByToken, updateParticipant } from '../services/participantService'
import { generateTeams } from '../services/teamService'
import { LABELS } from '../constants'
import type { Session, Participant } from '../types'
import ScoreWidget from '../components/ui/ScoreWidget'
import Button from '../components/ui/Button'

export default function EditPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const [session, setSession] = useState<Session | null>(null)
  const [participant, setParticipant] = useState<Participant | null>(null)
  const [loading, setLoading] = useState(true)
  const [scoreCopilot, setScoreCopilot] = useState(0)
  const [scoreMia, setScoreMia] = useState(0)
  const [service, setService] = useState('')
  const [name, setName] = useState('')

  useEffect(() => {
    if (!token) return
    const participantToken = localStorage.getItem(`eq_participant_${token}`)
    if (!participantToken) {
      navigate(`/join/${token}`, { replace: true })
      return
    }

    Promise.all([
      getSessionByToken(token),
      getParticipantByToken(participantToken),
    ]).then(([s, p]) => {
      setSession(s)
      if (p) {
        setParticipant(p)
        setScoreCopilot(p.scoreCopilot)
        setScoreMia(p.scoreMia)
        setService(p.service)
        setName(p.name)
      }
      setLoading(false)
    })
  }, [token, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!participant || !session) return

    await updateParticipant(participant.id, {
      name,
      service,
      scoreCopilot,
      scoreMia,
    })

    // Re-run team algorithm
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

  if (!session || !participant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[var(--color-text-muted)]">Session introuvable.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold text-center">
        {LABELS.editResponses}
      </h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        <div>
          <label className="block text-sm font-medium">{LABELS.copilotLabel}</label>
          <p className="text-xs text-[var(--color-text-muted)]">{LABELS.copilotHelp}</p>
          <ScoreWidget value={scoreCopilot} onChange={setScoreCopilot} />
        </div>

        <div>
          <label className="block text-sm font-medium">{LABELS.miaLabel}</label>
          <p className="text-xs text-[var(--color-text-muted)]">{LABELS.copilotHelp}</p>
          <ScoreWidget value={scoreMia} onChange={setScoreMia} />
        </div>

        <div>
          <label className="block text-sm font-medium">{LABELS.serviceLabel}</label>
          <select
            value={service}
            onChange={(e) => setService(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
          >
            {session.services.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">{LABELS.nameLabel}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={LABELS.namePlaceholder}
            required
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm"
          />
        </div>

        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            className="flex-1"
            onClick={() => navigate(`/waiting/${token}`)}
          >
            {LABELS.cancel}
          </Button>
          <Button type="submit" className="flex-1">
            {LABELS.save}
          </Button>
        </div>
      </form>
    </div>
  )
}
