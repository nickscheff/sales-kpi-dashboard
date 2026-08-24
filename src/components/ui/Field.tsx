interface Props {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  min?: number
  step?: number
}

export function NumberField({ label, value, onChange, suffix, min = 0, step = 1 }: Props) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      <span className="field-input-wrap">
        <input
          type="number"
          value={Number.isFinite(value) ? value : 0}
          min={min}
          step={step}
          onChange={(e) => onChange(e.target.valueAsNumber || 0)}
        />
        {suffix && <span className="field-suffix">{suffix}</span>}
      </span>
    </label>
  )
}
