type CrestProps = {
  className?: string
}

export function Crest({ className = 'h-10 w-10' }: CrestProps) {
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-gold/70 bg-white p-1 ${className}`}
      aria-hidden="true"
    >
      <img src="/chamabondo-crest.png" alt="" className="h-full w-full object-contain" />
    </span>
  )
}
