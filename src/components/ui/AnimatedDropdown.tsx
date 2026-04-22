import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

interface AnimatedDropdownProps<T extends string> {
  label?: string
  value: T
  options: readonly T[]
  onChange: (value: T) => void
}

const AnimatedDropdown = <T extends string>({
  label,
  value,
  options,
  onChange,
}: AnimatedDropdownProps<T>) => {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [])

  return (
    <div ref={rootRef} className="flex items-center gap-3">
      {label && (
        <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest whitespace-nowrap">
          {label}
        </label>
      )}

      <div className="relative min-w-[200px]">
        <motion.button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-full px-6 py-2 text-[10px] font-mono font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all"
        >
          <span>{value}</span>
          <motion.span
            animate={{ rotate: open ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="material-symbols-outlined text-xs text-white/40"
          >
            expand_more
          </motion.span>
        </motion.button>

        <AnimatePresence>
          {open && (
            <>
              <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.16 }}
                className="absolute top-full left-0 mt-2 w-full bg-[#111111] border border-white/10 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 p-2 space-y-1"
              >
                {options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      onChange(option)
                      setOpen(false)
                    }}
                    className={`w-full text-left px-4 py-2 text-[9px] font-mono font-bold uppercase tracking-widest rounded-xl transition-colors ${
                      option === value
                        ? 'bg-primary text-black'
                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default AnimatedDropdown
