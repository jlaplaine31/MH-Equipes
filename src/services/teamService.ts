import type { Team } from '../types'
import { mockDb } from './mockData'
import { assignTeams } from '../utils/teamAlgorithm'
import { getParticipants } from './participantService'

export async function getTeams(sessionId: string): Promise<Team[]> {
  const teams = mockDb.teams.filter((t) => t.sessionId === sessionId)
  const participants = mockDb.participants.filter((p) => p.sessionId === sessionId)

  return teams
    .sort((a, b) => a.order - b.order)
    .map((t) => ({
      ...t,
      members: participants.filter((p) => p.teamId === t.id),
    }))
}

export async function updateTeamColor(teamId: string, color: string): Promise<Team | null> {
  const team = mockDb.teams.find((t) => t.id === teamId)
  if (!team) return null
  team.color = color
  return team
}

export async function updateTeamTag(teamId: string, tag: string): Promise<Team | null> {
  const team = mockDb.teams.find((t) => t.id === teamId)
  if (!team) return null
  team.tag = tag
  return team
}

export async function generateTeams(sessionId: string, numTeams: number): Promise<Team[]> {
  const participants = await getParticipants(sessionId)

  // Reset all assignments
  for (const p of mockDb.participants) {
    if (p.sessionId === sessionId) {
      p.teamId = null
    }
  }

  // Ensure we have the right number of team slots
  const existingTeams = mockDb.teams.filter((t) => t.sessionId === sessionId)
  while (existingTeams.length < numTeams) {
    const idx = existingTeams.length
    const newTeam: Team = {
      id: `${sessionId}-team-${idx}`,
      sessionId,
      name: `Équipe ${idx + 1}`,
      color: mockDb.createEmptyTeams(sessionId, idx + 1)[idx].color,
      tag: '',
      order: idx,
      members: [],
    }
    mockDb.teams.push(newTeam)
    existingTeams.push(newTeam)
  }

  // Run algorithm
  const assignments = assignTeams(participants, numTeams)
  const teamsByIndex = existingTeams.sort((a, b) => a.order - b.order)

  for (const assignment of assignments) {
    const participant = mockDb.participants.find((p) => p.id === assignment.participantId)
    if (participant && teamsByIndex[assignment.teamIndex]) {
      participant.teamId = teamsByIndex[assignment.teamIndex].id
    }
  }

  return getTeams(sessionId)
}

export async function resetTeams(sessionId: string): Promise<void> {
  for (const p of mockDb.participants) {
    if (p.sessionId === sessionId) {
      p.teamId = null
    }
  }
}
