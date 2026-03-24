import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { useSessionData } from '../hooks/useSessionData'
import { updateTeamColor, updateTeamTag } from '../services/teamService'
import { LABELS, MIN_TEAMS, MAX_TEAMS } from '../constants'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import ParticipantPill from '../components/ui/ParticipantPill'
import Counter from '../components/ui/Counter'
import TeamGrid from '../components/teams/TeamGrid'
import Modal from '../components/ui/Modal'

type ViewMode = 'both' | 'qr' | 'teams'

export default function AdminPage() {
  const { id } = useParams<{ id: string }>()
  const { session, participants, teams, loading, rebalance, reset } = useSessionData(id)
  const [viewMode, setViewMode] = useState<ViewMode>('both')
  const [numTeamsInput, setNumTeamsInput] = useState<number | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)

  if (loading || !session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  const effectiveNumTeams = numTeamsInput ?? session.numTeams
  const joinUrl = `${window.location.origin}/equipes/join/${session.shareToken}`

  const showQr = viewMode === 'both' || viewMode === 'qr'
  const showTeams = viewMode === 'both' || viewMode === 'teams'

  function toggleView(panel: 'qr' | 'teams') {
    if (viewMode === 'both') {
      setViewMode(panel === 'qr' ? 'teams' : 'qr')
    } else if (viewMode === panel) {
      setViewMode('both')
    } else {
      setViewMode(panel)
    }
  }

  async function handleCopyUrl() {
    await navigator.clipboard.writeText(joinUrl)
  }

  function handleColorChange(teamId: string, color: string) {
    updateTeamColor(teamId, color)
  }

  function handleTagChange(teamId: string, tag: string) {
    updateTeamTag(teamId, tag)
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Toolbar */}
      <header className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2">
        <Link to="/" className="text-lg hover:opacity-70">⌂</Link>
        <Link to="/" className="text-sm text-[var(--color-text-muted)] hover:underline">
          Ateliers
        </Link>
        <span className="text-[var(--color-text-muted)]">|</span>
        <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          {session.title}
        </h1>
        <StatusBadge status={session.status} />
        <span className="text-sm text-[var(--color-text-muted)]">
          {participants.length} {LABELS.participants}
        </span>

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={showQr ? 'primary' : 'secondary'}
            className="text-xs"
            onClick={() => toggleView('qr')}
          >
            QR
          </Button>
          <Button
            variant={showTeams ? 'primary' : 'secondary'}
            className="text-xs"
            onClick={() => toggleView('teams')}
          >
            Équipes
          </Button>
          <span className="text-xs text-[var(--color-text-muted)]">Nb:</span>
          <input
            type="number"
            value={effectiveNumTeams}
            onChange={(e) => setNumTeamsInput(Number(e.target.value))}
            min={MIN_TEAMS}
            max={MAX_TEAMS}
            className="w-14 rounded-lg border border-[var(--color-border)] bg-transparent px-2 py-1 text-sm"
          />
          <Button variant="secondary" onClick={() => rebalance(effectiveNumTeams)}>
            {LABELS.rebalance}
          </Button>
          <Button variant="ghost" onClick={() => setShowResetModal(true)}>
            {LABELS.reset}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <main
        className="flex-1 overflow-auto p-4"
        style={{
          display: 'grid',
          gridTemplateColumns:
            showQr && showTeams ? '1fr 2fr' : '1fr',
          gap: '1rem',
        }}
      >
        {/* QR Panel */}
        {showQr && (
          <div className="flex flex-col items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-6">
            <QRCodeSVG
              value={joinUrl}
              size={280}
              fgColor="#1a1a1a"
              bgColor="#ffffff"
              level="M"
            />
            <button
              onClick={handleCopyUrl}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-accent-current)] underline"
            >
              Copier le lien
            </button>

            {/* Compteur */}
            <Counter value={participants.length} />

            {/* Pills */}
            <div className="flex flex-wrap gap-2 justify-center">
              {participants.map((p) => (
                <ParticipantPill key={p.id} participant={p} />
              ))}
            </div>
          </div>
        )}

        {/* Teams Panel */}
        {showTeams && (
          <div className="overflow-auto">
            <TeamGrid
              teams={teams}
              onColorChange={handleColorChange}
              onTagChange={handleTagChange}
            />
          </div>
        )}
      </main>

      {/* Reset modal */}
      <Modal
        open={showResetModal}
        title="Réinitialiser les équipes"
        onConfirm={() => { reset(); setShowResetModal(false) }}
        onCancel={() => setShowResetModal(false)}
        confirmLabel={LABELS.reset}
        danger
      >
        Toutes les assignations d'équipes seront supprimées. Les couleurs et tags seront conservés.
      </Modal>
    </div>
  )
}
