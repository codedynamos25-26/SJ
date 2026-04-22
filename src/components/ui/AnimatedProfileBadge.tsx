import { Link } from 'react-router-dom'

interface AnimatedProfileBadgeProps {
  name?: string
  initials: string
  to?: string
  className?: string
}

const AnimatedProfileBadge = ({ name, initials, to = '/dashboard', className = '' }: AnimatedProfileBadgeProps) => {
  const badge = (
    <div className={`relative w-10 h-10 ${className}`}>
      {/* Outer rotating ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-secondary to-primary opacity-100 animate-spin" style={{ animationDuration: '4s' }} />
      
      {/* Middle ring */}
      <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-primary/50 to-transparent" style={{ animation: 'spin 6s linear infinite reverse' }} />
      
      {/* Inner content */}
      <div className="absolute inset-1 rounded-full bg-gradient-to-br from-[#0d141c] via-[#141414] to-[#0A0A0A] border border-primary/30 flex items-center justify-center">
        {/* Badge content */}
        <div className="relative flex items-center justify-center w-full h-full">
          <div className="text-center">
            <span className="font-black text-sm text-primary leading-none">{initials[0]}</span>
          </div>
        </div>
      </div>
      
      {/* Glow effect */}
      <div className="absolute -inset-1 rounded-full bg-primary/20 blur-md opacity-50 animate-pulse" />
    </div>
  )

  return to ? (
    <Link to={to} title={name} className="hover:scale-110 transition-transform duration-300">
      {badge}
    </Link>
  ) : (
    badge
  )
}

export default AnimatedProfileBadge
