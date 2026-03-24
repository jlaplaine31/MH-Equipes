import type { ReactNode } from 'react'
import Button from './Button'
import { LABELS } from '../../constants'

interface ModalProps {
  open: boolean
  title: string
  children: ReactNode
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  danger?: boolean
}

export default function Modal({
  open,
  title,
  children,
  onConfirm,
  onCancel,
  confirmLabel = LABELS.confirm,
  danger = false,
}: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-[var(--color-card)] p-6 shadow-xl">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          {title}
        </h2>
        <div className="mt-3 text-sm text-[var(--color-text-muted)]">{children}</div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            {LABELS.cancel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
