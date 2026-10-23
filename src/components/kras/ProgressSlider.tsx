import { useEffect, useId, useRef, useState } from 'react'

interface ProgressSliderProps {
  value: number
  label: string
  disabled?: boolean
  onCommit: (value: number) => Promise<void> | void
}

export function ProgressSlider({
  value,
  label,
  disabled = false,
  onCommit,
}: ProgressSliderProps) {
  const inputId = useId()
  const [local, setLocal] = useState(value)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)

  useEffect(() => {
    setLocal(value)
  }, [value])

  const commit = () => {
    if (savingRef.current || disabled || local === value) return

    savingRef.current = true
    setSaving(true)

    void Promise.resolve(onCommit(local)).finally(() => {
      savingRef.current = false
      setSaving(false)
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={inputId}
          className="text-[11px] font-bold uppercase tracking-wide text-slate-500"
        >
          Progress
        </label>
        <span className="font-mono text-xs font-bold tabular-nums text-primary">
          {local}%
        </span>
      </div>

      <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            local >= 100 ? 'bg-emerald-500' : 'bg-primary'
          }`}
          style={{ width: `${local}%` }}
        />
      </div>

      <input
        id={inputId}
        type="range"
        min={0}
        max={100}
        step={5}
        value={local}
        disabled={disabled || saving}
        aria-label={`Update progress for ${label}`}
        aria-valuetext={`${local} percent`}
        onChange={(event) => setLocal(Number(event.target.value))}
        onPointerUp={commit}
        onKeyUp={commit}
        onBlur={commit}
        className="kra-range mt-3"
        style={{
          background: `linear-gradient(to right, #0B5D3B ${local}%, #E2E8F0 ${local}%)`,
        }}
      />

      <p className="mt-1 min-h-[16px] text-[11px] font-medium text-slate-400">
        {saving ? 'Saving progress...' : 'Drag to update your progress'}
      </p>
    </div>
  )
}
