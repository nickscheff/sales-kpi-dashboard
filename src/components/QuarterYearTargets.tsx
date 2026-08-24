import { Card } from './ui/Card'
import { NumberField } from './ui/Field'
import type { QuarterTarget, YearTarget } from '../types'

interface Props {
  quarterTarget: QuarterTarget
  yearTarget: YearTarget
  onChangeQuarterTarget: (target: number) => void
  onChangeYearTarget: (target: number) => void
}

export function QuarterYearTargets({ quarterTarget, yearTarget, onChangeQuarterTarget, onChangeYearTarget }: Props) {
  return (
    <Card title="Quartals- & Jahresziel" subtitle="Unabhängig vom Monatsziel vorgegeben">
      <div className="period-grid">
        <div className="period">
          <h3>{quarterTarget.quarterLabel}</h3>
          <NumberField label="Quartalsziel" value={quarterTarget.target} onChange={onChangeQuarterTarget} suffix="€" step={1000} />
        </div>
        <div className="period">
          <h3>{yearTarget.year}</h3>
          <NumberField label="Jahresziel" value={yearTarget.target} onChange={onChangeYearTarget} suffix="€" step={5000} />
        </div>
      </div>
    </Card>
  )
}
