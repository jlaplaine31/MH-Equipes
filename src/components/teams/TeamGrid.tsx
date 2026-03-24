import type { Team } from '../../types'
import TeamCard from './TeamCard'

interface TeamGridProps {
  teams: Team[]
  onColorChange: (teamId: string, color: string) => void
  onTagChange: (teamId: string, tag: string) => void
}

export default function TeamGrid({ teams, onColorChange, onTagChange }: TeamGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {teams
        .sort((a, b) => a.order - b.order)
        .map((team) => (
          <TeamCard
            key={team.id}
            team={team}
            onColorChange={onColorChange}
            onTagChange={onTagChange}
          />
        ))}
    </div>
  )
}
