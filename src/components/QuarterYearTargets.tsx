import { Card } from './ui/Card'
import { NumberField } from './ui/Field'

interface Props {
  quarterLabel: string
  quarterTarget: number
  year: number
  yearTarget: number
  onChangeQuarterTarget: (target: number) => void
  onChangeYearTarget: (target: number) => void
}

export function QuarterYearTargets({
  quarterLabel,
  quarterTarget,
  year,
  yearTarget,
  onChangeQuarterTarget,
  onChangeYearTarget,
}: Props) {
  return (
    <Card title="Quartals- & Jahresziel" subtitle="Gilt für das Quartal bzw. Jahr des gewählten Monats">
      <div className="period-grid">
        <div className="period">
          <h3>{quarterLabel}</h3>
          <NumberField label="Quartalsziel" value={quarterTarget} onChange={onChangeQuarterTarget} suffix="€" step={1000} />
        </div>
        <div className="period">
          <h3>{year}</h3>
          <NumberField label="Jahresziel" value={yearTarget} onChange={onChangeYearTarget} suffix="€" step={5000} />
        </div>
      </div>
    </Card>
  )
}
