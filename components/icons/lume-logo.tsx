import Image from 'next/image'

export function LumeLogo({ className = "", showTagline = false }: { className?: string; showTagline?: boolean }) {
  // In dark mode, apply a filter to blend better with the toolbar
  const logoClass = `dark:invert dark:hue-rotate-180 dark:opacity-90 ${className || ''}`

  if (showTagline) {
    // Logo con tagline per pagine dove c'è più spazio (login, signup)
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <Image
          src="/lume-logo-new.png"
          alt="Lume Logo"
          width={400}
          height={400}
          className={`w-full h-full ${logoClass}`}
          priority
        />
        {showTagline && (
          <div className="text-[10px] text-muted-foreground text-center mt-1 font-medium leading-tight whitespace-nowrap">
            Lead Unified Mapping Enrichment
          </div>
        )}
      </div>
    )
  }

  // Logo senza tagline per header - versione MOLTO più grande (200x200)
  return (
    <Image
      src="/lume-logo-new.png"
      alt="Lume Logo"
      width={200}
      height={200}
      className={logoClass}
      priority
    />
  )
}
