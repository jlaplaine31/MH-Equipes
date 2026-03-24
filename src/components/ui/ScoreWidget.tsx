interface ScoreWidgetProps {
  value: number
  onChange: (value: number) => void
  max?: number
}

export default function ScoreWidget({ value, onChange, max = 5 }: ScoreWidgetProps) {
  return (
    <div className="mt-2 flex gap-2">
      {Array.from({ length: max + 1 }, (_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className={`h-10 w-10 rounded-lg text-sm font-semibold transition-colors ${
            i <= value
              ? 'bg-[var(--color-accent-current)] text-white'
              : 'bg-[var(--color-card)] text-[var(--color-text)] border border-[var(--color-border)]'
          }`}
        >
          {i}
        </button>
      ))}
    </div>
  )
}
