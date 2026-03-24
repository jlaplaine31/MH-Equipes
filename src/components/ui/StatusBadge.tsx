import type { Session } from '../../types'
import { LABELS } from '../../constants'

const statusConfig: Record<Session['status'], { label: string; className: string }> = {
  open: {
    label: LABELS.open,
    className: 'bg-green-100 text-green-800',
  },
  generated: {
    label: LABELS.generated,
    className: 'bg-blue-100 text-blue-800',
  },
  closed: {
    label: LABELS.closed,
    className: 'bg-gray-100 text-gray-600',
  },
}

interface StatusBadgeProps {
  status: Session['status']
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status]
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
