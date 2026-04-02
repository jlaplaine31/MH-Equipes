import type { Participant } from '../types'
import { mockDb } from './mockData'
import { isFlowConfigured, flowGet, flowPost, flowPatch, flowDelete } from './powerAutomateClient'
import { TABLES, PARTICIPANT_COLS } from './dataverseSchema'

const useMock = () => !isFlowConfigured() || (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapParticipant(row: any): Participant {
  return {
    id: row[PARTICIPANT_COLS.id],
    sessionId: row[PARTICIPANT_COLS.session] ?? '',
    name: row[PARTICIPANT_COLS.name] ?? '',
    service: row[PARTICIPANT_COLS.service] ?? '',
    scoreCopilot: row[PARTICIPANT_COLS.scoreCopilot] ?? 0,
    scoreMia: row[PARTICIPANT_COLS.scoreMia] ?? 0,
    sessionToken: row[PARTICIPANT_COLS.sessionToken] ?? '',
    teamId: row[PARTICIPANT_COLS.team] ?? null,
    createdAt: row[PARTICIPANT_COLS.createdOn] ?? '',
  }
}

export async function getParticipants(sessionId: string): Promise<Participant[]> {
  if (useMock()) {
    return mockDb.participants
      .filter((p) => p.sessionId === sessionId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }
  const resp = await flowGet<Record<string, unknown>>(
    `${TABLES.participants}?$filter=${PARTICIPANT_COLS.session} eq ${sessionId}&$orderby=${PARTICIPANT_COLS.createdOn} asc`,
  )
  return resp.value.map(mapParticipant)
}

export async function getParticipantByToken(sessionToken: string): Promise<Participant | null> {
  if (useMock()) {
    return mockDb.participants.find((p) => p.sessionToken === sessionToken) ?? null
  }
  const resp = await flowGet<Record<string, unknown>>(
    `${TABLES.participants}?$filter=${PARTICIPANT_COLS.sessionToken} eq '${sessionToken}'&$top=1`,
  )
  return resp.value.length > 0 ? mapParticipant(resp.value[0]) : null
}

export async function createParticipant(data: {
  sessionId: string
  name: string
  service: string
  scoreCopilot: number
  scoreMia: number
}): Promise<Participant> {
  const sessionToken = crypto.randomUUID().replace(/-/g, '')

  if (useMock()) {
    const id = `p-${Date.now()}`
    const participant: Participant = {
      id, sessionId: data.sessionId, name: data.name, service: data.service,
      scoreCopilot: Math.min(5, Math.max(1, data.scoreCopilot)),
      scoreMia: Math.min(5, Math.max(1, data.scoreMia)),
      sessionToken, teamId: null, createdAt: new Date().toISOString(),
    }
    mockDb.participants.push(participant)
    return participant
  }

  const body = {
    [PARTICIPANT_COLS.name]: data.name,
    [PARTICIPANT_COLS.service]: data.service,
    [PARTICIPANT_COLS.scoreCopilot]: Math.min(5, Math.max(1, data.scoreCopilot)),
    [PARTICIPANT_COLS.scoreMia]: Math.min(5, Math.max(1, data.scoreMia)),
    [PARTICIPANT_COLS.sessionToken]: sessionToken,
    'aaa_Session@odata.bind': `/${TABLES.sessions}(${data.sessionId})`,
  }
  await flowPost(TABLES.participants, body)

  // POST returns 204 — fetch the created participant by sessionToken
  const created = await getParticipantByToken(sessionToken)

  return created ?? {
    id: `p-${Date.now()}`, sessionId: data.sessionId, name: data.name, service: data.service,
    scoreCopilot: data.scoreCopilot, scoreMia: data.scoreMia,
    sessionToken, teamId: null, createdAt: new Date().toISOString(),
  }
}

export async function updateParticipant(
  id: string,
  data: Partial<Pick<Participant, 'name' | 'service' | 'scoreCopilot' | 'scoreMia'>>,
): Promise<Participant | null> {
  if (useMock()) {
    const participant = mockDb.participants.find((p) => p.id === id)
    if (!participant) return null
    if (data.scoreCopilot !== undefined) data.scoreCopilot = Math.min(5, Math.max(1, data.scoreCopilot))
    if (data.scoreMia !== undefined) data.scoreMia = Math.min(5, Math.max(1, data.scoreMia))
    Object.assign(participant, data)
    return participant
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body: any = {}
  if (data.name !== undefined) body[PARTICIPANT_COLS.name] = data.name
  if (data.service !== undefined) body[PARTICIPANT_COLS.service] = data.service
  if (data.scoreCopilot !== undefined) body[PARTICIPANT_COLS.scoreCopilot] = Math.min(5, Math.max(1, data.scoreCopilot))
  if (data.scoreMia !== undefined) body[PARTICIPANT_COLS.scoreMia] = Math.min(5, Math.max(1, data.scoreMia))

  await flowPatch(`${TABLES.participants}(${id})`, body)

  // Re-fetch
  const resp = await flowGet<Record<string, unknown>>(
    `${TABLES.participants}(${id})`,
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = resp as any
  return raw[PARTICIPANT_COLS.id] ? mapParticipant(raw) : null
}

export async function deleteParticipant(id: string): Promise<void> {
  if (useMock()) {
    const idx = mockDb.participants.findIndex((p) => p.id === id)
    if (idx >= 0) mockDb.participants.splice(idx, 1)
    return
  }
  await flowDelete(`${TABLES.participants}(${id})`)
}

export async function deleteAllParticipants(sessionId: string): Promise<void> {
  const participants = await getParticipants(sessionId)
  await Promise.all(participants.map((p) => deleteParticipant(p.id)))
}

// Helper to assign a participant to a team in Dataverse
export async function assignParticipantToTeam(participantId: string, teamId: string | null): Promise<void> {
  if (useMock()) {
    const p = mockDb.participants.find((p) => p.id === participantId)
    if (p) p.teamId = teamId
    return
  }

  if (teamId) {
    await flowPatch(`${TABLES.participants}(${participantId})`, {
      'aaa_Team@odata.bind': `/${TABLES.teams}(${teamId})`,
    })
  } else {
    // Dissociate: set to null
    await flowPatch(`${TABLES.participants}(${participantId})`, {
      '_aaa_team_value': null,
    })
  }
}
