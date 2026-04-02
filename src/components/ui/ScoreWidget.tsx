interface ScoreWidgetProps {
  value: number
  onChange: (value: number) => void
  max?: number
  min?: number
}

export default function ScoreWidget({ value, onChange, max = 5, min = 1 }: ScoreWidgetProps) {
  const count = max - min + 1
  return (
    <div className="mt-2 flex gap-2">
      {Array.from({ length: count }, (_, idx) => {
        const score = min + idx
        return (
          <button
            key={score}
            type="button"
            onClick={() => onChange(score)}
            className={`h-10 w-10 rounded-lg text-sm font-semibold transition-colors ${
              score <= value
                ? 'bg-[var(--color-accent-current)] text-white'
                : 'bg-[var(--color-card)] text-[var(--color-text)] border border-[var(--color-border)]'
            }`}
          >
            {score}
          </button>
        )
      })}
    </div>
  )
}
