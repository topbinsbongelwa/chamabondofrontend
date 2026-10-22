type CrestProps = {
  className?: string
}

/**
 * Placeholder crest for Chamabondo Primary School.
 * Swap the SVG for the official crest image later on - the gold frame stays.
 */
export function Crest({ className = 'h-10 w-10' }: CrestProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-gold/70 bg-white p-1 ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" fill="none" className="h-full w-full">
        <path
          d="M16 2.5 4.5 6v9.2c0 7 4.9 12.4 11.5 14.3 6.6-1.9 11.5-7.3 11.5-14.3V6L16 2.5Z"
          fill="#0B5D3B"
        />
        <path d="M8.5 12.5h7.5a2 2 0 0 1 2 2v9a2 2 0 0 0-2-2H8.5v-9Z" fill="#D4AF37" />
        <path d="M23.5 12.5H16a2 2 0 0 0-2 2v9a2 2 0 0 1 2-2h7.5v-9Z" fill="#D4AF37" opacity="0.75" />
        <path d="M16 4.6l8.6 2.5v7.7c0 5.3-3.5 9.4-8.6 11-5.1-1.6-8.6-5.7-8.6-11V7.1L16 4.6Z" stroke="#D4AF37" strokeWidth="1.2" />
      </svg>
    </span>
  )
}
