import { formatCurrency } from '../lib/format'
import type { NextCommissionTierProgress } from '../lib/calculations'

interface Props {
  progress: NextCommissionTierProgress
}

export function CommissionTierTracker({ progress }: Props) {
  return (
    <div className="gold-tracker">
      <div className="gold-tracker-header">
        <span className="gold-tracker-icon" aria-hidden="true">
          🏅
        </span>
        <span className="gold-tracker-title">Nächste Provisionsstufe</span>
      </div>
      {progress.nextTier ? (
        <>
          <div className="gold-tracker-amount">{formatCurrency(progress.amountRemaining)}</div>
          <p className="gold-tracker-subtext">
            noch bis {progress.nextTier.rate}% ({progress.nextTier.label})
          </p>
          <div className="gold-tracker-track">
            <div className="gold-tracker-fill" style={{ width: `${progress.progressPct * 100}%` }} />
          </div>
        </>
      ) : (
        <p className="gold-tracker-maxed">🏆 Höchste Stufe erreicht</p>
      )}
    </div>
  )
}
