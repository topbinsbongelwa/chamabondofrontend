type CrestProps = {
  className?: string
}

export function Crest({ className = 'h-10 w-10' }: CrestProps) {
  return (
    <img
      src="/chamabondo-crest.png"
      alt=""
      aria-hidden="true"
      className={`inline-flex shrink-0 object-contain ${className}`}
    />
  )
}
