export function LumeLogo({ className = "", showTagline = false }: { className?: string; showTagline?: boolean }) {
  // Rainbow gradient definition (same for both versions)
  const rainbowGradient = (
    <defs>
      <linearGradient id="rainbowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="20%" stopColor="#f97316" />
        <stop offset="40%" stopColor="#eab308" />
        <stop offset="60%" stopColor="#22c55e" />
        <stop offset="80%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
  )

  // Light rays like classic child's sun drawing - top-right quadrant only
  // Alternating long/short rays, detached from the L
  const lightRays = (
    <>
      {/* 15 degrees - going up-right (SHORT) */}
      <line x1="46" y1="21" x2="65" y2="15" stroke="url(#rainbowGradient)" strokeWidth="3" strokeLinecap="round" opacity="0.8" />

      {/* 30 degrees - more diagonal (LONG) */}
      <line x1="46" y1="21" x2="78" y2="10" stroke="url(#rainbowGradient)" strokeWidth="3" strokeLinecap="round" opacity="1.0" />

      {/* 45 degrees - perfect diagonal (SHORT) */}
      <line x1="46" y1="21" x2="68" y2="-1" stroke="url(#rainbowGradient)" strokeWidth="3" strokeLinecap="round" opacity="0.8" />

      {/* 60 degrees - approaching vertical (LONG) */}
      <line x1="46" y1="21" x2="62" y2="-5" stroke="url(#rainbowGradient)" strokeWidth="3" strokeLinecap="round" opacity="1.0" />

      {/* 75 degrees - nearly vertical (SHORT) */}
      <line x1="46" y1="21" x2="50" y2="-2" stroke="url(#rainbowGradient)" strokeWidth="3" strokeLinecap="round" opacity="0.8" />
    </>
  )

  if (showTagline) {
    // Logo con tagline per pagine dove c'è più spazio (login, signup)
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Background circle */}
          <circle cx="50" cy="50" r="48" fill="white" />

          {rainbowGradient}
          {lightRays}

          {/* Navy blue L */}
          <path d="M 30 25 L 30 75 L 70 75 L 70 65 L 42 65 L 42 25 Z" fill="#1e3a5f" />
          <path d="M 30 25 L 30 75 L 70 75 L 70 65 L 42 65 L 42 25 Z" stroke="#d4af37" strokeWidth="3" fill="none" />

          {/* Data points */}
          <circle cx="45" cy="55" r="2" fill="#d4af37" opacity="0.9"/>
          <circle cx="52" cy="55" r="2" fill="#d4af37" opacity="0.9"/>
          <circle cx="45" cy="62" r="2" fill="#d4af37" opacity="0.9"/>
          <circle cx="52" cy="62" r="2" fill="#d4af37" opacity="0.9"/>
        </svg>
        <div className="text-[8px] text-muted-foreground text-center mt-1 font-medium leading-tight whitespace-nowrap">
          Lead Unified Mapping Enrichment
        </div>
      </div>
    )
  }

  // Logo senza tagline per header
  return (
    <svg
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background circle */}
      <circle cx="50" cy="50" r="48" fill="white" />

      {rainbowGradient}
      {lightRays}

      {/* Navy blue L */}
      <path d="M 30 25 L 30 75 L 70 75 L 70 65 L 42 65 L 42 25 Z" fill="#1e3a5f" />
      <path d="M 30 25 L 30 75 L 70 75 L 70 65 L 42 65 L 42 25 Z" stroke="#d4af37" strokeWidth="3" fill="none" />

      {/* Data points */}
      <circle cx="45" cy="55" r="2" fill="#d4af37" opacity="0.9"/>
      <circle cx="52" cy="55" r="2" fill="#d4af37" opacity="0.9"/>
      <circle cx="45" cy="62" r="2" fill="#d4af37" opacity="0.9"/>
      <circle cx="52" cy="62" r="2" fill="#d4af37" opacity="0.9"/>
    </svg>
  )
}
