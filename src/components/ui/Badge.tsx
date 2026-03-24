interface BadgeProps {
  label: string
  color?: string
  className?: string
}

export default function Badge({ label, color, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
      style={color ? { backgroundColor: color, color: '#fff' } : undefined}
    >
      {label}
    </span>
  )
}
