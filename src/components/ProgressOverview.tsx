import { CommissionTierTracker } from './CommissionTierTracker'
import { Card } from './ui/Card'
import { ProgressBar } from './ui/ProgressBar'
import { formatCurrency } from '../lib/format'
import type { CommissionTier, NextCommissionTierProgress, RecordStatus } from '../lib/calculations'

interface Props {
  monthActual: number
  monthTarget: number
  quarterLabel: string
  quarterActual: number
  quarterTarget: number
  yearLabel: number
  yearActual: number
  yearTarget: number
  commission: number
  grossTotal: number
  commissionTier: CommissionTier
  nextTierProgress: NextCommissionTierProgress
  record: RecordStatus
}

export function ProgressOverview({
  monthActual,
  monthTarget,
  quarterLabel,
  quarterActual,
  quarterTarget,
  yearLabel,
  yearActual,
  yearTarget,
  commission,
  grossTotal,
  commissionTier,
  nextTierProgress,
  record,
}: Props) {
  return (
    <Card title="Umsatz-Fortschritt" className="span-2">
      <div className="progress-overview">
        <ProgressBar label="Monat" actual={monthActual} target={monthTarget} />
        <CommissionTierTracker progress={nextTierProgress} />
        <ProgressBar label={`Quartal (${quarterLabel})`} actual={quarterActual} target={quarterTarget} />
        <ProgressBar label={`Jahr (${yearLabel})`} actual={yearActual} target={yearTarget} />
      </div>

      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">Provision</span>
          <span className="kpi-value">{formatCurrency(commission)}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Brutto gesamt</span>
          <span className="kpi-value">{formatCurrency(grossTotal)}</span>
        </div>
      </div>
      <p className="tier-hint">
        Aktuelle Stufe: {commissionTier.rate}% ({commissionTier.label})
      </p>
      <p className={`record-banner${record.isRecord ? ' is-record' : ''}`}>
        {record.isRecord
          ? '🏆 Rekordmonat! Neuer Bestwert erreicht.'
          : record.recordValue === null
            ? 'Noch keine Historie zum Vergleich vorhanden.'
            : `${formatCurrency(record.diffToRecord)} bis zum bisherigen Rekord (${formatCurrency(record.recordValue)})`}
      </p>
    </Card>
  )
}
