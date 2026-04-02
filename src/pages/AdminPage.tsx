import { useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as XLSX from 'xlsx'
import { useSessionData } from '../hooks/useSessionData'
import { updateTeamColor, updateTeamTag } from '../services/teamService'
import { createParticipant, deleteAllParticipants } from '../services/participantService'
import { LABELS, MIN_TEAMS, MAX_TEAMS } from '../constants'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import TeamGrid from '../components/teams/TeamGrid'
import Modal from '../components/ui/Modal'

export default function AdminPage() {
  const { id } = useParams<{ id: string }>()
  const { session, participants, teams, loading, rebalance, reset, refresh } = useSessionData(id)
  const [numTeamsInput, setNumTeamsInput] = useState<number | null>(null)
  const [showResetModal, setShowResetModal] = useState(false)
  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (loading || !session) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  const effectiveNumTeams = numTeamsInput ?? session.numTeams

  function handleColorChange(teamId: string, color: string) {
    updateTeamColor(teamId, color)
  }

  function handleTagChange(teamId: string, tag: string) {
    updateTeamTag(teamId, tag)
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !id) return

    setImporting(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 })

      // Skip header row
      const dataRows = rows.slice(1).filter((row) => row.length >= 10 && row[9])

      // Delete all existing participants
      await deleteAllParticipants(id)

      // Create new participants from file
      for (const row of dataRows) {
        const scoreCopilot = Math.min(5, Math.max(1, Number(row[6]) || 1))
        const scoreMia = Math.min(5, Math.max(1, Number(row[7]) || 1))
        const service = String(row[8] || '')
        const name = String(row[9] || '')

        await createParticipant({
          sessionId: id,
          name,
          service,
          scoreCopilot,
          scoreMia,
        })
      }

      await refresh()
    } finally {
      setImporting(false)
      // Reset file input so the same file can be re-imported
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
            variant="secondary"
            className="text-xs"
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
          >
            {importing ? 'Import...' : 'Importer'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={handleImport}
          />
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
      <main className="flex-1 overflow-auto p-4">
        <TeamGrid
          teams={teams}
          onColorChange={handleColorChange}
          onTagChange={handleTagChange}
        />
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
