import { formatCurrency, formatPercent } from '../../lib/format'

interface Props {
  label: string
  actual: number
  target: number
}

export function ProgressBar({ label, actual, target }: Props) {
  const pct = target > 0 ? actual / target : 0
  const widthPct = Math.min(100, Math.max(0, pct * 100))

  return (
    <div className="progress-block">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className="progress-values">
          {formatCurrency(actual)} / {formatCurrency(target)} ({formatPercent(pct)})
        </span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${widthPct}%` }} />
      </div>
    </div>
  )
}
