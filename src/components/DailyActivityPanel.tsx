import { useState } from 'react'
import { Card } from './ui/Card'
import { PillButton } from './ui/PillButton'

interface Props {
  decisionCallsMade: number
  onChange: (value: number) => void
}

export function DailyActivityPanel({ decisionCallsMade, onChange }: Props) {
  const [input, setInput] = useState('')

  const add = () => {
    const parsed = Number(input)
    if (!Number.isFinite(parsed) || parsed === 0) return
    onChange(decisionCallsMade + parsed)
    setInput('')
  }

  return (
    <Card title="Tagesaktivität" subtitle="Entscheider-Gespräche geführt">
      <div className="daily-activity-total">
        <span className="kpi-value">{decisionCallsMade}</span>
        <span className="field-label">diesen Monat geführt</span>
      </div>
      <div className="daily-activity-form">
        <input
          type="number"
          value={input}
          placeholder="z.B. 3"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') add()
          }}
        />
        <PillButton type="button" onClick={add}>
          + heute hinzufügen
        </PillButton>
      </div>
    </Card>
  )
}
