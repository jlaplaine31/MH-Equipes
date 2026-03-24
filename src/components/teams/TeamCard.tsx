import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Team } from '../../types'
import ExpertBadges from '../ui/ExpertBadges'

interface TeamCardProps {
  team: Team
  onColorChange: (teamId: string, color: string) => void
  onTagChange: (teamId: string, tag: string) => void
}

export default function TeamCard({ team, onColorChange, onTagChange }: TeamCardProps) {
  const [tag, setTag] = useState(team.tag)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    setTag(team.tag)
  }, [team.tag])

  function handleTagInput(value: string) {
    setTag(value)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onTagChange(team.id, value)
    }, 500)
  }

  const isEmpty = team.members.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className={`rounded-xl bg-[var(--color-card)] p-4 ${
        isEmpty
          ? 'border-2 border-dashed border-[var(--color-border)]'
          : 'border border-[var(--color-border)]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={team.color}
          onChange={(e) => onColorChange(team.id, e.target.value)}
          className="h-6 w-6 cursor-pointer rounded border-0"
        />
        <h3
          className="font-[family-name:var(--font-display)] text-sm font-semibold"
          style={{ color: team.color }}
        >
          {team.name}
        </h3>
        <span className="ml-auto text-xs text-[var(--color-text-muted)]">
          {team.members.length}
        </span>
      </div>

      {/* Tag */}
      <input
        type="text"
        value={tag}
        onChange={(e) => handleTagInput(e.target.value)}
        placeholder="Tag..."
        className="mt-2 w-full rounded-md border border-[var(--color-border)] bg-transparent px-2 py-1 text-xs"
      />

      {/* Membres */}
      <ul className="mt-3 space-y-1">
        {team.members.map((member) => (
          <motion.li
            key={member.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex items-center gap-2 rounded-md px-2 py-1 text-sm"
          >
            <span className="font-medium">{member.name}</span>
            <ExpertBadges participant={member} />
            <span className="ml-auto text-xs text-[var(--color-text-muted)]">
              {member.service}
            </span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  )
}
