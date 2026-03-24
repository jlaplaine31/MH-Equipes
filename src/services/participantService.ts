import type { Participant } from '../types'
import { mockDb } from './mockData'

export async function getParticipants(sessionId: string): Promise<Participant[]> {
  return mockDb.participants
    .filter((p) => p.sessionId === sessionId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export async function getParticipantByToken(sessionToken: string): Promise<Participant | null> {
  return mockDb.participants.find((p) => p.sessionToken === sessionToken) ?? null
}

export async function createParticipant(data: {
  sessionId: string
  name: string
  service: string
  scoreCopilot: number
  scoreMia: number
}): Promise<Participant> {
  const id = `p-${Date.now()}`
  const participant: Participant = {
    id,
    sessionId: data.sessionId,
    name: data.name,
    service: data.service,
    scoreCopilot: Math.min(5, Math.max(0, data.scoreCopilot)),
    scoreMia: Math.min(5, Math.max(0, data.scoreMia)),
    sessionToken: crypto.randomUUID().replace(/-/g, ''),
    teamId: null,
    createdAt: new Date().toISOString(),
  }
  mockDb.participants.push(participant)
  return participant
}

export async function updateParticipant(
  id: string,
  data: Partial<Pick<Participant, 'name' | 'service' | 'scoreCopilot' | 'scoreMia'>>,
): Promise<Participant | null> {
  const participant = mockDb.participants.find((p) => p.id === id)
  if (!participant) return null
  if (data.scoreCopilot !== undefined) data.scoreCopilot = Math.min(5, Math.max(0, data.scoreCopilot))
  if (data.scoreMia !== undefined) data.scoreMia = Math.min(5, Math.max(0, data.scoreMia))
  Object.assign(participant, data)
  return participant
}
