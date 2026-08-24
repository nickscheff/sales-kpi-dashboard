import { Card } from './ui/Card'
import { NumberField } from './ui/Field'
import { formatCurrency } from '../lib/format'
import type { PeriodSum } from '../lib/calculations'
import type { QuarterTarget, YearTarget } from '../types'

interface Props {
  quarterTarget: QuarterTarget
  yearTarget: YearTarget
  quarterSum: PeriodSum
  yearSum: PeriodSum
  onChangeQuarterTarget: (target: number) => void
  onChangeYearTarget: (target: number) => void
}

export function QuarterYearPanel({
  quarterTarget,
  yearTarget,
  quarterSum,
  yearSum,
  onChangeQuarterTarget,
  onChangeYearTarget,
}: Props) {
  return (
    <Card title="Quartal & Jahr" subtitle="Unabhängig vom Monatsziel vorgegeben">
      <div className="period-grid">
        <div className="period">
          <h3>{quarterTarget.quarterLabel}</h3>
          <NumberField label="Quartalsziel" value={quarterTarget.target} onChange={onChangeQuarterTarget} suffix="€" step={1000} />
          <p>Ist: {formatCurrency(quarterSum.sum)}</p>
          <p>Fehlbetrag: {formatCurrency(quarterSum.shortfall)}</p>
        </div>
        <div className="period">
          <h3>{yearTarget.year}</h3>
          <NumberField label="Jahresziel" value={yearTarget.target} onChange={onChangeYearTarget} suffix="€" step={5000} />
          <p>Ist: {formatCurrency(yearSum.sum)}</p>
          <p>Fehlbetrag: {formatCurrency(yearSum.shortfall)}</p>
        </div>
      </div>
    </Card>
  )
}
