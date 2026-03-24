import { describe, it, expect } from 'vitest'
import { assignTeams } from '../teamAlgorithm'
import type { Participant } from '../../types'

function makeParticipant(
  id: string,
  service: string,
  scoreCopilot = 0,
  scoreMia = 0,
): Participant {
  return {
    id,
    sessionId: 's1',
    name: `Participant ${id}`,
    service,
    scoreCopilot,
    scoreMia,
    sessionToken: `tok_${id}`,
    teamId: null,
    createdAt: '2026-01-01',
  }
}

describe('assignTeams', () => {
  it('retourne un tableau vide si aucun participant', () => {
    expect(assignTeams([], 4)).toEqual([])
  })

  it('reduit le nombre d equipes si moins de participants', () => {
    const participants = [
      makeParticipant('1', 'A'),
      makeParticipant('2', 'B'),
    ]
    const result = assignTeams(participants, 5)
    expect(result).toHaveLength(2)
    const teamIndices = new Set(result.map(a => a.teamIndex))
    expect(teamIndices.size).toBe(2)
  })

  it('distribue 20 participants en 4 equipes equilibrees', () => {
    const services = ['Transformation', 'Reporting', 'Conformité', 'Hypervision']
    const participants = Array.from({ length: 20 }, (_, i) =>
      makeParticipant(
        String(i),
        services[i % services.length],
        i < 6 ? 4 : 0, // 6 experts
        0,
      ),
    )

    const result = assignTeams(participants, 4)
    expect(result).toHaveLength(20)

    // Compter les membres par equipe
    const teamSizes = [0, 0, 0, 0]
    for (const a of result) {
      teamSizes[a.teamIndex]++
    }

    // Chaque equipe doit avoir 5 membres
    for (const size of teamSizes) {
      expect(size).toBe(5)
    }
  })

  it('garantit au moins 1 expert par equipe quand possible', () => {
    const participants = [
      makeParticipant('e1', 'A', 4, 0),
      makeParticipant('e2', 'B', 0, 5),
      makeParticipant('e3', 'C', 3, 0),
      makeParticipant('n1', 'A', 1, 1),
      makeParticipant('n2', 'B', 0, 0),
      makeParticipant('n3', 'C', 2, 2),
    ]

    const result = assignTeams(participants, 3)

    // Verifier qu'il y a au moins 1 expert dans chaque equipe
    const expertIds = new Set(['e1', 'e2', 'e3'])
    const teamsWithExperts = new Set<number>()
    for (const a of result) {
      if (expertIds.has(a.participantId)) {
        teamsWithExperts.add(a.teamIndex)
      }
    }
    expect(teamsWithExperts.size).toBe(3)
  })

  it('respecte la contrainte max 2 du meme service par equipe', () => {
    // 8 participants, 4 du meme service
    const participants = [
      makeParticipant('1', 'A', 4, 0),
      makeParticipant('2', 'A', 0, 0),
      makeParticipant('3', 'A', 0, 0),
      makeParticipant('4', 'A', 0, 0),
      makeParticipant('5', 'B', 3, 0),
      makeParticipant('6', 'B', 0, 0),
      makeParticipant('7', 'C', 0, 0),
      makeParticipant('8', 'C', 0, 0),
    ]

    const result = assignTeams(participants, 2)

    // Compter service A par equipe
    const serviceAPerTeam: Record<number, number> = {}
    for (const a of result) {
      const p = participants.find(p => p.id === a.participantId)!
      if (p.service === 'A') {
        serviceAPerTeam[a.teamIndex] = (serviceAPerTeam[a.teamIndex] || 0) + 1
      }
    }

    for (const count of Object.values(serviceAPerTeam)) {
      expect(count).toBeLessThanOrEqual(2)
    }
  })

  it('gere le cas ou tous les participants sont experts', () => {
    const participants = Array.from({ length: 12 }, (_, i) =>
      makeParticipant(String(i), ['A', 'B', 'C'][i % 3], 5, 4),
    )

    const result = assignTeams(participants, 3)
    expect(result).toHaveLength(12)

    // Verifier l equilibre : chaque equipe doit avoir 4 membres
    const teamSizes: Record<number, number> = {}
    for (const a of result) {
      teamSizes[a.teamIndex] = (teamSizes[a.teamIndex] || 0) + 1
    }
    for (const size of Object.values(teamSizes)) {
      expect(size).toBe(4)
    }

    // Tous les experts doivent etre assignes
    const assignedIds = new Set(result.map(a => a.participantId))
    expect(assignedIds.size).toBe(12)
  })

  it('gere un seul participant', () => {
    const participants = [makeParticipant('solo', 'A', 2, 1)]
    const result = assignTeams(participants, 5)

    expect(result).toHaveLength(1)
    expect(result[0].teamIndex).toBe(0)
    expect(result[0].participantId).toBe('solo')
  })

  it('utilise le fallback MAX_SAME_SERVICE quand tous du meme service', () => {
    // 10 participants, tous du meme service, 3 equipes
    const participants = Array.from({ length: 10 }, (_, i) =>
      makeParticipant(String(i), 'UniqueService', i < 3 ? 4 : 0, 0),
    )

    const result = assignTeams(participants, 3)
    expect(result).toHaveLength(10)

    // Le fallback doit fonctionner : chaque participant est assigne
    const assignedIds = new Set(result.map(a => a.participantId))
    expect(assignedIds.size).toBe(10)

    // Verifier l equilibre des tailles (3 ou 4 par equipe)
    const teamSizes: Record<number, number> = {}
    for (const a of result) {
      teamSizes[a.teamIndex] = (teamSizes[a.teamIndex] || 0) + 1
    }
    const sizes = Object.values(teamSizes)
    for (const size of sizes) {
      expect(size).toBeGreaterThanOrEqual(3)
      expect(size).toBeLessThanOrEqual(4)
    }
  })

  it('distribue 50 participants en 9 equipes (scenario realiste)', () => {
    const services = [
      'Transformation',
      'Reporting & Performance',
      'Conformite',
      'Hypervision & Planification',
    ]
    // ~12 experts (scoreCopilot >= 3), reste non-experts
    const participants = Array.from({ length: 50 }, (_, i) =>
      makeParticipant(
        String(i),
        services[i % services.length],
        i < 12 ? 3 + (i % 3) : i % 3, // 12 experts
        i < 4 ? 4 : 0,
      ),
    )

    const result = assignTeams(participants, 9)
    expect(result).toHaveLength(50)

    // Toutes les equipes utilisees
    const teamIndices = new Set(result.map(a => a.teamIndex))
    expect(teamIndices.size).toBe(9)

    // Equilibre des tailles : 50 / 9 = 5 ou 6 par equipe
    const teamSizes: Record<number, number> = {}
    for (const a of result) {
      teamSizes[a.teamIndex] = (teamSizes[a.teamIndex] || 0) + 1
    }
    for (const size of Object.values(teamSizes)) {
      expect(size).toBeGreaterThanOrEqual(5)
      expect(size).toBeLessThanOrEqual(6)
    }

    // Chaque equipe a au moins 1 expert (12 experts pour 9 equipes)
    const expertIds = new Set(
      participants.filter(p => p.scoreCopilot >= 3 || p.scoreMia >= 3).map(p => p.id),
    )
    const teamsWithExperts = new Set<number>()
    for (const a of result) {
      if (expertIds.has(a.participantId)) {
        teamsWithExperts.add(a.teamIndex)
      }
    }
    expect(teamsWithExperts.size).toBe(9)
  })
})
