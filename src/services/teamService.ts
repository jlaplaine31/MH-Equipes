import type { Team, Participant } from '../types'
import { TEAM_COLORS } from '../constants'
import { mockDb } from './mockData'
import { assignTeams } from '../utils/teamAlgorithm'
import { getParticipants, assignParticipantToTeam } from './participantService'
import { isFlowConfigured, flowGet, flowPost, flowPatch } from './powerAutomateClient'
import { TABLES, TEAM_COLS } from './dataverseSchema'

const useMock = () => !isFlowConfigured() || (import.meta.env.VITE_USE_MOCK ?? 'true') === 'true'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTeam(row: any, members: Participant[] = []): Team {
  return {
    id: row[TEAM_COLS.id],
    sessionId: row[TEAM_COLS.session] ?? '',
    name: row[TEAM_COLS.name] ?? '',
    color: row[TEAM_COLS.color] ?? '#3b82f6',
    tag: row[TEAM_COLS.tag] ?? '',
    order: row[TEAM_COLS.order] ?? 0,
    members,
  }
}

export async function getTeams(sessionId: string): Promise<Team[]> {
  if (useMock()) {
    const teams = mockDb.teams.filter((t) => t.sessionId === sessionId)
    const participants = mockDb.participants.filter((p) => p.sessionId === sessionId)
    return teams
      .sort((a, b) => a.order - b.order)
      .map((t) => ({ ...t, members: participants.filter((p) => p.teamId === t.id) }))
  }

  const [teamsResp, participants] = await Promise.all([
    flowGet<Record<string, unknown>>(
      `${TABLES.teams}?$filter=${TEAM_COLS.session} eq ${sessionId}&$orderby=${TEAM_COLS.order} asc`,
    ),
    getParticipants(sessionId),
  ])

  return teamsResp.value.map((row) => {
    const teamId = row[TEAM_COLS.id] as string
    const members = participants.filter((p) => p.teamId === teamId)
    return mapTeam(row, members)
  })
}

export async function updateTeamColor(teamId: string, color: string): Promise<Team | null> {
  if (useMock()) {
    const team = mockDb.teams.find((t) => t.id === teamId)
    if (!team) return null
    team.color = color
    return team
  }
  await flowPatch(`${TABLES.teams}(${teamId})`, { [TEAM_COLS.color]: color })
  return null
}

export async function updateTeamTag(teamId: string, tag: string): Promise<Team | null> {
  if (useMock()) {
    const team = mockDb.teams.find((t) => t.id === teamId)
    if (!team) return null
    team.tag = tag
    return team
  }
  await flowPatch(`${TABLES.teams}(${teamId})`, { [TEAM_COLS.tag]: tag })
  return null
}

export async function generateTeams(sessionId: string, numTeams: number): Promise<Team[]> {
  const participants = await getParticipants(sessionId)

  if (useMock()) {
    // Reset all assignments
    for (const p of mockDb.participants) {
      if (p.sessionId === sessionId) p.teamId = null
    }
    // Ensure team slots
    const existingTeams = mockDb.teams.filter((t) => t.sessionId === sessionId)
    while (existingTeams.length < numTeams) {
      const idx = existingTeams.length
      const newTeam: Team = {
        id: `${sessionId}-team-${idx}`, sessionId,
        name: `Équipe ${idx + 1}`,
        color: TEAM_COLORS[idx % TEAM_COLORS.length],
        tag: '', order: idx, members: [],
      }
      mockDb.teams.push(newTeam)
      existingTeams.push(newTeam)
    }
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

  // --- Dataverse mode ---

  // Get existing teams
  const teams = await getTeams(sessionId)

  // Create missing team slots
  for (let i = teams.length; i < numTeams; i++) {
    await flowPost(TABLES.teams, {
      [TEAM_COLS.name]: `Équipe ${i + 1}`,
      [TEAM_COLS.color]: TEAM_COLORS[i % TEAM_COLORS.length],
      [TEAM_COLS.tag]: '',
      [TEAM_COLS.order]: i,
      [TEAM_COLS.sessionBind]: `/${TABLES.sessions}(${sessionId})`,
    })
  }

  // Re-fetch teams after potential creation
  const allTeams = await getTeams(sessionId)
  const teamsByIndex = allTeams.sort((a, b) => a.order - b.order)

  // Reset all participant assignments
  for (const p of participants) {
    if (p.teamId) {
      await assignParticipantToTeam(p.id, null)
    }
  }

  // Run algorithm
  const assignments = assignTeams(participants, numTeams)

  // Apply assignments
  for (const assignment of assignments) {
    const team = teamsByIndex[assignment.teamIndex]
    if (team) {
      await assignParticipantToTeam(assignment.participantId, team.id)
    }
  }

  return getTeams(sessionId)
}

export async function resetTeams(sessionId: string): Promise<void> {
  if (useMock()) {
    for (const p of mockDb.participants) {
      if (p.sessionId === sessionId) p.teamId = null
    }
    return
  }

  const participants = await getParticipants(sessionId)
  for (const p of participants) {
    if (p.teamId) {
      await assignParticipantToTeam(p.id, null)
    }
  }
}
