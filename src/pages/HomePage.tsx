import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getSessions, createSession, deleteSession } from '../services/sessionService'
import { LABELS, DEFAULT_SERVICES, DEFAULT_NUM_TEAMS, MIN_TEAMS, MAX_TEAMS } from '../constants'
import type { Session } from '../types'
import Button from '../components/ui/Button'
import StatusBadge from '../components/ui/StatusBadge'
import Modal from '../components/ui/Modal'

export default function HomePage() {
  const { user, isAuthenticated, login, logout } = useAuth()
  const navigate = useNavigate()
  const [sessions, setSessions] = useState<Session[]>([])
  const [title, setTitle] = useState('')
  const [numTeams, setNumTeams] = useState(DEFAULT_NUM_TEAMS)
  const [services, setServices] = useState(DEFAULT_SERVICES.join(', '))
  const [deleteTarget, setDeleteTarget] = useState<Session | null>(null)
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      getSessions().then(setSessions)
    }
  }, [isAuthenticated])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (creating) return
    setCreating(true)
    try {
      const session = await createSession({
        title: title || LABELS.workshopNameDefault,
        numTeams,
        services: services.split(',').map((s) => s.trim()).filter(Boolean),
      })
      navigate(`/session/${session.id}`)
    } finally {
      setCreating(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteSession(deleteTarget.id)
    setSessions(await getSessions())
    setDeleteTarget(null)
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            {LABELS.appTitle}
          </h1>
          <p className="mt-2 text-[var(--color-text-muted)]">
            {LABELS.myWorkshopsSubtitle}
          </p>
          <Button className="mt-6" onClick={login}>
            Se connecter
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold">
            {LABELS.myWorkshops}
          </h1>
          <p className="mt-1 text-[var(--color-text-muted)]">
            {LABELS.myWorkshopsSubtitle}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[var(--color-text-muted)]">{user?.name}</span>
          <Button variant="ghost" onClick={logout}>Déconnexion</Button>
        </div>
      </div>

      {/* Formulaire de creation */}
      <form
        onSubmit={handleCreate}
        className="mt-6 flex flex-wrap items-end gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"
      >
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-[var(--color-text-muted)]">
            {LABELS.workshopName}
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={LABELS.workshopNameDefault}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="w-24">
          <label className="block text-xs font-medium text-[var(--color-text-muted)]">
            {LABELS.numTeams}
          </label>
          <input
            type="number"
            value={numTeams}
            onChange={(e) => setNumTeams(Number(e.target.value))}
            min={MIN_TEAMS}
            max={MAX_TEAMS}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium text-[var(--color-text-muted)]">
            {LABELS.services}
          </label>
          <input
            type="text"
            value={services}
            onChange={(e) => setServices(e.target.value)}
            className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm"
          />
        </div>
        <Button type="submit" disabled={creating}>
          {creating ? 'Création…' : LABELS.createWorkshop}
        </Button>
      </form>

      {/* Liste des sessions */}
      <div className="mt-8 space-y-3">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-[family-name:var(--font-display)] font-semibold">
                  {session.title}
                </span>
                <StatusBadge status={session.status} />
              </div>
              <div className="mt-1 flex gap-4 text-xs text-[var(--color-text-muted)]">
                <span>{session.numTeams} {LABELS.teams}</span>
                <span>{new Date(session.createdAt).toLocaleDateString('fr-FR')}</span>
              </div>
            </div>
            <Button variant="secondary" onClick={() => navigate(`/session/${session.id}`)}>
              Ouvrir
            </Button>
            <Button variant="ghost" onClick={() => setDeleteTarget(session)}>
              {LABELS.delete}
            </Button>
          </div>
        ))}
        {sessions.length === 0 && (
          <p className="text-center text-sm text-[var(--color-text-muted)] py-8">
            Aucun atelier pour le moment. Créez-en un ci-dessus.
          </p>
        )}
      </div>

      {/* Modal de suppression */}
      <Modal
        open={!!deleteTarget}
        title="Supprimer l'atelier"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmLabel={LABELS.delete}
        danger
      >
        Voulez-vous vraiment supprimer « {deleteTarget?.title} » ? Cette action est irréversible.
      </Modal>
    </div>
  )
}
