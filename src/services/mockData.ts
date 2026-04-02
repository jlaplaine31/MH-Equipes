import type { Session, Participant, Team } from '../types'
import { DEFAULT_SERVICES, DEFAULT_NUM_TEAMS, TEAM_COLORS } from '../constants'

// --- Sessions ---

const sessions: Session[] = [
  {
    id: 'demo-1',
    organizerId: 'user-1',
    title: 'Formation Copilot & Mia',
    numTeams: DEFAULT_NUM_TEAMS,
    services: [...DEFAULT_SERVICES],
    shareToken: 'abc123def456',
    status: 'open',
    createdAt: '2026-03-23T10:00:00Z',
  },
]

// --- Participants ---

const participants: Participant[] = [
  { id: 'p1', sessionId: 'demo-1', name: 'Marie D.', service: 'Transformation', scoreCopilot: 4, scoreMia: 1, sessionToken: 'tok_p1', teamId: null, createdAt: '2026-03-23T10:05:00Z' },
  { id: 'p2', sessionId: 'demo-1', name: 'Julien M.', service: 'Reporting & Performance', scoreCopilot: 1, scoreMia: 4, sessionToken: 'tok_p2', teamId: null, createdAt: '2026-03-23T10:06:00Z' },
  { id: 'p3', sessionId: 'demo-1', name: 'Sophie L.', service: 'Conformité', scoreCopilot: 3, scoreMia: 3, sessionToken: 'tok_p3', teamId: null, createdAt: '2026-03-23T10:07:00Z' },
  { id: 'p4', sessionId: 'demo-1', name: 'Thomas R.', service: 'Hypervision & Planification', scoreCopilot: 1, scoreMia: 1, sessionToken: 'tok_p4', teamId: null, createdAt: '2026-03-23T10:08:00Z' },
  { id: 'p5', sessionId: 'demo-1', name: 'Camille B.', service: 'Transformation', scoreCopilot: 1, scoreMia: 2, sessionToken: 'tok_p5', teamId: null, createdAt: '2026-03-23T10:09:00Z' },
  { id: 'p6', sessionId: 'demo-1', name: 'Lucas P.', service: 'Reporting & Performance', scoreCopilot: 5, scoreMia: 2, sessionToken: 'tok_p6', teamId: null, createdAt: '2026-03-23T10:10:00Z' },
  { id: 'p7', sessionId: 'demo-1', name: 'Léa V.', service: 'Conformité', scoreCopilot: 2, scoreMia: 1, sessionToken: 'tok_p7', teamId: null, createdAt: '2026-03-23T10:11:00Z' },
  { id: 'p8', sessionId: 'demo-1', name: 'Nathan G.', service: 'Hypervision & Planification', scoreCopilot: 1, scoreMia: 5, sessionToken: 'tok_p8', teamId: null, createdAt: '2026-03-23T10:12:00Z' },
  { id: 'p9', sessionId: 'demo-1', name: 'Emma C.', service: 'Transformation', scoreCopilot: 4, scoreMia: 4, sessionToken: 'tok_p9', teamId: null, createdAt: '2026-03-23T10:13:00Z' },
]

// --- Teams (pre-created empty slots) ---

function createEmptyTeams(sessionId: string, numTeams: number): Team[] {
  return Array.from({ length: numTeams }, (_, i) => ({
    id: `${sessionId}-team-${i}`,
    sessionId,
    name: `Équipe ${i + 1}`,
    color: TEAM_COLORS[i % TEAM_COLORS.length],
    tag: '',
    order: i,
    members: [],
  }))
}

const teams: Team[] = createEmptyTeams('demo-1', DEFAULT_NUM_TEAMS)

// --- Export ---

export const mockDb = {
  sessions,
  participants,
  teams,
  createEmptyTeams,
}
