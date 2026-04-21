import { useEffect, useRef, useState } from 'react'
import { motion, useSpring, useMotionValue } from 'framer-motion'

const CustomCursor = () => {
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const [isHovering, setIsHovering] = useState(false)
  const [isPointer, setIsPointer] = useState(false)
  const rafRef = useRef<number>(0)

  const springCfg = { damping: 28, stiffness: 400, mass: 0.5 }
  const ringX = useSpring(cursorX, springCfg)
  const ringY = useSpring(cursorY, springCfg)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        cursorX.set(e.clientX)
        cursorY.set(e.clientY)
      })
    }

    const onEnter = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button') ||
        target.getAttribute('role') === 'button'
      ) {
        setIsHovering(true)
      }
    }

    const onLeave = () => setIsHovering(false)

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseover', onEnter)
    window.addEventListener('mouseout', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseover', onEnter)
      window.removeEventListener('mouseout', onLeave)
      cancelAnimationFrame(rafRef.current)
    }
  }, [cursorX, cursorY])

  // Only render on pointer (non-touch) devices
  useEffect(() => {
    setIsPointer(window.matchMedia('(pointer: fine)').matches)
  }, [])

  if (!isPointer) return null

  return (
    <>
      {/* Dot — snaps instantly */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{ scale: isHovering ? 1.5 : 1 }}
        transition={{ duration: 0.15 }}
      >
        <div className="w-2 h-2 bg-primary" />
      </motion.div>

      {/* Ring — spring follows */}
      <motion.div
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          x: ringX,
          y: ringY,
          translateX: '-50%',
          translateY: '-50%',
        }}
        animate={{
          width: isHovering ? 52 : 36,
          height: isHovering ? 52 : 36,
          opacity: isHovering ? 0.9 : 0.6,
        }}
        transition={{ duration: 0.2 }}
      >
        <div
          className="w-full h-full border border-primary"
          style={{ boxShadow: isHovering ? '0 0 12px rgba(211,239,87,0.4)' : 'none' }}
        />
      </motion.div>
    </>
  )
}

export default CustomCursor
