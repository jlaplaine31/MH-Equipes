export interface Session {
  id: string
  organizerId: string
  title: string
  numTeams: number
  services: string[]
  shareToken: string
  status: 'open' | 'closed' | 'generated'
  createdAt: string
}

export interface Participant {
  id: string
  sessionId: string
  name: string
  service: string
  scoreCopilot: number
  scoreMia: number
  sessionToken: string
  teamId: string | null
  createdAt: string
}

export interface Team {
  id: string
  sessionId: string
  name: string
  color: string
  tag: string
  order: number
  members: Participant[]
}

export interface TeamWithMembers extends Team {
  members: Participant[]
}
