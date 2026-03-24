import { motion } from 'framer-motion'

interface CounterProps {
  value: number
  className?: string
}

/**
 * Grand compteur anime avec effet scale-bounce.
 * Le `key` force un re-render a chaque changement de valeur,
 * declenchant l'animation d'entree.
 */
export default function Counter({ value, className }: CounterProps) {
  return (
    <motion.div
      key={value}
      initial={{ scale: 1.15 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2 }}
      className={
        className ??
        "font-[family-name:var(--font-display)] text-[3.5rem] font-bold text-[var(--color-accent-current)]"
      }
    >
      {value}
    </motion.div>
  )
}
