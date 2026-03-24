import { EXPERT_THRESHOLD, MAX_SAME_SERVICE, TARGET_SIZE } from '../constants'
import type { Participant } from '../types'

export interface TeamAssignment {
  teamIndex: number
  participantId: string
}

interface TeamSlot {
  members: Participant[]
  serviceCounts: Record<string, number>
  expertCount: number
}

function isExpert(p: Participant): boolean {
  return p.scoreCopilot >= EXPERT_THRESHOLD || p.scoreMia >= EXPERT_THRESHOLD
}

/**
 * Entrelace les participants par service pour maximiser la diversite.
 * Alterne entre les services pour que les participants consecutifs
 * soient de services differents.
 */
function interleaveByService(participants: Participant[]): Participant[] {
  const byService: Record<string, Participant[]> = {}
  for (const p of participants) {
    const key = p.service || '_unknown'
    if (!byService[key]) byService[key] = []
    byService[key].push(p)
  }

  const serviceQueues = Object.values(byService)
  serviceQueues.sort((a, b) => b.length - a.length)

  const result: Participant[] = []
  let remaining = true
  while (remaining) {
    remaining = false
    for (const queue of serviceQueues) {
      if (queue.length > 0) {
        result.push(queue.shift()!)
        remaining = true
      }
    }
  }

  return result
}

function serviceCountInTeam(team: TeamSlot, service: string): number {
  return team.serviceCounts[service] || 0
}

function addToTeam(team: TeamSlot, participant: Participant): void {
  team.members.push(participant)
  const key = participant.service || '_unknown'
  team.serviceCounts[key] = (team.serviceCounts[key] || 0) + 1
  if (isExpert(participant)) {
    team.expertCount++
  }
}

/**
 * Algorithme de formation d'equipes equilibrees.
 * Retourne un tableau d'assignations (teamIndex -> participantId).
 */
export function assignTeams(
  participants: Participant[],
  numTeams: number,
): TeamAssignment[] {
  const effectiveNumTeams = Math.min(numTeams, participants.length)
  if (effectiveNumTeams === 0) return []

  const teams: TeamSlot[] = Array.from({ length: effectiveNumTeams }, () => ({
    members: [],
    serviceCounts: {},
    expertCount: 0,
  }))

  const experts = interleaveByService(participants.filter(isExpert))
  const nonExperts = interleaveByService(participants.filter(p => !isExpert(p)))

  // Phase 1 : 1 expert par equipe
  const phase1Count = Math.min(effectiveNumTeams, experts.length)
  for (let i = 0; i < phase1Count; i++) {
    addToTeam(teams[i], experts[i])
  }

  // Phase 2 : distribuer les experts restants
  for (let i = phase1Count; i < experts.length; i++) {
    const expert = experts[i]
    const service = expert.service || '_unknown'

    let bestIdx = -1
    let bestExpertCount = Infinity

    for (let t = 0; t < effectiveNumTeams; t++) {
      if (serviceCountInTeam(teams[t], service) >= MAX_SAME_SERVICE) continue
      if (
        teams[t].expertCount < bestExpertCount ||
        (teams[t].expertCount === bestExpertCount && bestIdx > t)
      ) {
        bestExpertCount = teams[t].expertCount
        bestIdx = t
      }
    }

    // Fallback si contrainte de service impossible
    if (bestIdx === -1) {
      bestIdx = 0
      for (let t = 1; t < effectiveNumTeams; t++) {
        if (teams[t].expertCount < teams[bestIdx].expertCount) {
          bestIdx = t
        }
      }
    }

    addToTeam(teams[bestIdx], expert)
  }

  // Phase 3 : remplir avec les non-experts
  for (const participant of nonExperts) {
    const service = participant.service || '_unknown'
    const minSize = Math.min(...teams.map(t => t.members.length))
    const cap = Math.max(TARGET_SIZE, minSize + 1)

    let bestIdx = -1
    let bestScore = Infinity

    for (let t = 0; t < effectiveNumTeams; t++) {
      if (teams[t].members.length >= cap) continue
      if (serviceCountInTeam(teams[t], service) >= MAX_SAME_SERVICE) continue

      const diversityBonus = serviceCountInTeam(teams[t], service) === 0 ? -10 : 0
      const score = teams[t].members.length * 1000 + diversityBonus + t
      if (score < bestScore) {
        bestScore = score
        bestIdx = t
      }
    }

    // Fallback : equipe avec le moins du meme service
    if (bestIdx === -1) {
      let minSameService = Infinity
      for (let t = 0; t < effectiveNumTeams; t++) {
        const count = serviceCountInTeam(teams[t], service)
        if (count < minSameService) {
          minSameService = count
          bestIdx = t
        }
      }
    }

    addToTeam(teams[bestIdx], participant)
  }

  // Construire les assignations
  const assignments: TeamAssignment[] = []
  for (let t = 0; t < effectiveNumTeams; t++) {
    for (const member of teams[t].members) {
      assignments.push({ teamIndex: t, participantId: member.id })
    }
  }

  return assignments
}
