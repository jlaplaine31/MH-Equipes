import { motion } from 'framer-motion'
import type { Participant } from '../../types'

interface ParticipantPillProps {
  participant: Participant
}

export default function ParticipantPill({ participant }: ParticipantPillProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-card)] border border-[var(--color-border)] px-3 py-1 text-sm"
    >
      <span className="font-medium">{participant.name}</span>
      <span className="text-[var(--color-text-muted)] text-xs">{participant.service}</span>
    </motion.div>
  )
}
