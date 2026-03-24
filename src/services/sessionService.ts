import type { Session } from '../types'
import { mockDb } from './mockData'
import { DEFAULT_SERVICES, DEFAULT_NUM_TEAMS } from '../constants'

export async function getSessions(): Promise<Session[]> {
  return [...mockDb.sessions].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function getSession(id: string): Promise<Session | null> {
  return mockDb.sessions.find((s) => s.id === id) ?? null
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  return mockDb.sessions.find((s) => s.shareToken === token) ?? null
}

export async function createSession(data: {
  title: string
  numTeams: number
  services: string[]
}): Promise<Session> {
  const id = `session-${Date.now()}`
  const session: Session = {
    id,
    organizerId: 'user-1', // TODO: from auth
    title: data.title || 'Formation d\'équipes',
    numTeams: data.numTeams || DEFAULT_NUM_TEAMS,
    services: data.services.length > 0 ? data.services : [...DEFAULT_SERVICES],
    shareToken: crypto.randomUUID().replace(/-/g, '').slice(0, 16),
    status: 'open',
    createdAt: new Date().toISOString(),
  }
  mockDb.sessions.push(session)

  // Pre-create empty team slots
  const newTeams = mockDb.createEmptyTeams(id, session.numTeams)
  mockDb.teams.push(...newTeams)

  return session
}

export async function updateSession(
  id: string,
  data: Partial<Pick<Session, 'title' | 'numTeams' | 'services' | 'status'>>,
): Promise<Session | null> {
  const session = mockDb.sessions.find((s) => s.id === id)
  if (!session) return null
  Object.assign(session, data)
  return session
}

export async function deleteSession(id: string): Promise<boolean> {
  const idx = mockDb.sessions.findIndex((s) => s.id === id)
  if (idx === -1) return false
  mockDb.sessions.splice(idx, 1)
  // Cascade: remove participants and teams
  const pIdx = mockDb.participants.filter((p) => p.sessionId !== id)
  mockDb.participants.length = 0
  mockDb.participants.push(...pIdx)
  const tIdx = mockDb.teams.filter((t) => t.sessionId !== id)
  mockDb.teams.length = 0
  mockDb.teams.push(...tIdx)
  return true
}
