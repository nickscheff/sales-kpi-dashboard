import { Card } from './ui/Card'
import { formatCurrency, formatPercent } from '../lib/format'
import type { RecordStatus } from '../lib/calculations'

interface Props {
  actualRevenue: number
  commission: number
  grossTotal: number
  achievementPct: number
  missingRevenue: number
  record: RecordStatus
}

export function KpiOverview({ actualRevenue, commission, grossTotal, achievementPct, missingRevenue, record }: Props) {
  return (
    <Card title="Kennzahlen – Aktueller Monat">
      <div className="kpi-grid">
        <div className="kpi">
          <span className="kpi-label">Ist-Umsatz</span>
          <span className="kpi-value">{formatCurrency(actualRevenue)}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Zielerreichung</span>
          <span className="kpi-value">{formatPercent(achievementPct)}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Fehlender Umsatz</span>
          <span className="kpi-value">{formatCurrency(missingRevenue)}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Provision</span>
          <span className="kpi-value">{formatCurrency(commission)}</span>
        </div>
        <div className="kpi">
          <span className="kpi-label">Brutto gesamt</span>
          <span className="kpi-value">{formatCurrency(grossTotal)}</span>
        </div>
      </div>
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
