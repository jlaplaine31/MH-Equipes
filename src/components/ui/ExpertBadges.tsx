import { EXPERT_THRESHOLD } from '../../constants'
import type { Participant } from '../../types'

interface ExpertBadgesProps {
  participant: Participant
}

export default function ExpertBadges({ participant }: ExpertBadgesProps) {
  const isCopilotExpert = participant.scoreCopilot >= EXPERT_THRESHOLD
  const isMiaExpert = participant.scoreMia >= EXPERT_THRESHOLD

  if (!isCopilotExpert && !isMiaExpert) return null

  return (
    <span className="inline-flex gap-1">
      {isCopilotExpert && (
        <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-bold text-blue-700">
          CP
        </span>
      )}
      {isMiaExpert && (
        <span className="rounded-full bg-pink-100 px-1.5 py-0.5 text-[10px] font-bold text-pink-700">
          Mia
        </span>
      )}
    </span>
  )
}
