import type { Session } from '../types'
import { mockDb } from './mockData'
import { DEFAULT_SERVICES, DEFAULT_NUM_TEAMS, TEAM_COLORS } from '../constants'
import { isFlowConfigured, flowGet, flowPost, flowPatch, flowDelete } from './powerAutomateClient'
import { TABLES, SESSION_COLS, TEAM_COLS, STATUS_VALUES, statusToLabel, statusToValue } from './dataverseSchema'

const useMock = () => !isFlowConfigured() || (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'

// --- Mappers Dataverse → App ---

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSession(row: any): Session {
  return {
    id: row[SESSION_COLS.id],
    organizerId: row[SESSION_COLS.ownerId] ?? '',
    title: row[SESSION_COLS.title] ?? '',
    numTeams: row[SESSION_COLS.numTeams] ?? DEFAULT_NUM_TEAMS,
    services: row[SESSION_COLS.services] ? JSON.parse(row[SESSION_COLS.services]) : [...DEFAULT_SERVICES],
    shareToken: row[SESSION_COLS.shareToken] ?? '',
    status: statusToLabel(row[SESSION_COLS.status]),
    createdAt: row[SESSION_COLS.createdOn] ?? '',
  }
}

// --- API ---

export async function getSessions(): Promise<Session[]> {
  if (useMock()) {
    return [...mockDb.sessions].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }
  const resp = await flowGet<Record<string, unknown>>(
    `${TABLES.sessions}?$orderby=${SESSION_COLS.createdOn} desc`,
  )
  return resp.value.map(mapSession)
}

export async function getSession(id: string): Promise<Session | null> {
  if (useMock()) {
    return mockDb.sessions.find((s) => s.id === id) ?? null
  }
  const resp = await flowGet<Record<string, unknown>>(
    `${TABLES.sessions}(${id})`,
  )
  // Single entity: not wrapped in value[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = resp as any
  if (raw[SESSION_COLS.id]) return mapSession(raw)
  return resp.value?.[0] ? mapSession(resp.value[0]) : null
}

export async function getSessionByToken(token: string): Promise<Session | null> {
  if (useMock()) {
    return mockDb.sessions.find((s) => s.shareToken === token) ?? null
  }
  const resp = await flowGet<Record<string, unknown>>(
    `${TABLES.sessions}?$filter=${SESSION_COLS.shareToken} eq '${token}'&$top=1`,
  )
  return resp.value.length > 0 ? mapSession(resp.value[0]) : null
}

export async function createSession(data: {
  title: string
  numTeams: number
  services: string[]
}): Promise<Session> {
  const title = data.title || 'Formation d\'équipes'
  const numTeams = data.numTeams || DEFAULT_NUM_TEAMS
  const services = data.services.length > 0 ? data.services : [...DEFAULT_SERVICES]
  const shareToken = crypto.randomUUID().replace(/-/g, '').slice(0, 16)

  if (useMock()) {
    const id = `session-${Date.now()}`
    const session: Session = {
      id, organizerId: 'user-1', title, numTeams, services,
      shareToken, status: 'open', createdAt: new Date().toISOString(),
    }
    mockDb.sessions.push(session)
    const newTeams = mockDb.createEmptyTeams(id, numTeams)
    mockDb.teams.push(...newTeams)
    return session
  }

  // Create session in Dataverse
  const body = {
    [SESSION_COLS.title]: title,
    [SESSION_COLS.numTeams]: numTeams,
    [SESSION_COLS.services]: JSON.stringify(services),
    [SESSION_COLS.shareToken]: shareToken,
    [SESSION_COLS.status]: STATUS_VALUES.open,
  }
  await flowPost(TABLES.sessions, body)

  // POST returns 204 — fetch the created session by shareToken to get the ID
  const created = await getSessionByToken(shareToken)
  const sessionId = created?.id

  // Pre-create team slots
  if (sessionId) {
    for (let i = 0; i < numTeams; i++) {
      await flowPost(TABLES.teams, {
        [TEAM_COLS.name]: `Équipe ${i + 1}`,
        [TEAM_COLS.color]: TEAM_COLORS[i % TEAM_COLORS.length],
        [TEAM_COLS.tag]: '',
        [TEAM_COLS.order]: i,
        [TEAM_COLS.sessionBind]: `/${TABLES.sessions}(${sessionId})`,
      })
    }
  }

  return created ?? {
    id: `session-${Date.now()}`,
    organizerId: '', title, numTeams, services,
    shareToken, status: 'open', createdAt: new Date().toISOString(),
  }
}

export async function updateSession(
  id: string,
  data: Partial<Pick<Session, 'title' | 'numTeams' | 'services' | 'status'>>,
): Promise<Session | null> {
  if (useMock()) {
    const session = mockDb.sessions.find((s) => s.id === id)
    if (!session) return null
    Object.assign(session, data)
    return session
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {}
  if (data.title !== undefined) body[SESSION_COLS.title] = data.title
  if (data.numTeams !== undefined) body[SESSION_COLS.numTeams] = data.numTeams
  if (data.services !== undefined) body[SESSION_COLS.services] = JSON.stringify(data.services)
  if (data.status !== undefined) body[SESSION_COLS.status] = statusToValue(data.status)

  await flowPatch(`${TABLES.sessions}(${id})`, body)
  return getSession(id)
}

export async function deleteSession(id: string): Promise<boolean> {
  if (useMock()) {
    const idx = mockDb.sessions.findIndex((s) => s.id === id)
    if (idx === -1) return false
    mockDb.sessions.splice(idx, 1)
    const pIdx = mockDb.participants.filter((p) => p.sessionId !== id)
    mockDb.participants.length = 0
    mockDb.participants.push(...pIdx)
    const tIdx = mockDb.teams.filter((t) => t.sessionId !== id)
    mockDb.teams.length = 0
    mockDb.teams.push(...tIdx)
    return true
  }

  await flowDelete(`${TABLES.sessions}(${id})`)
  return true
}
