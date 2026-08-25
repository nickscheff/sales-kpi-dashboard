import { useState } from 'react'
import { Card } from './ui/Card'
import { PillButton } from './ui/PillButton'
import { todayISODate } from '../lib/calculations'
import { newId } from '../lib/id'
import type { DailyActivityEntry } from '../types'

interface Props {
  entries: DailyActivityEntry[]
  onChange: (entries: DailyActivityEntry[]) => void
}

export function DailyActivityPanel({ entries, onChange }: Props) {
  const [input, setInput] = useState('')
  const total = entries.reduce((sum, entry) => sum + entry.count, 0)

  const add = () => {
    const parsed = Number(input)
    if (!Number.isFinite(parsed) || parsed === 0) return
    onChange([...entries, { id: newId(), date: todayISODate(), count: parsed }])
    setInput('')
  }

  return (
    <Card title="Tagesaktivität" subtitle="Entscheider-Gespräche geführt">
      <div className="daily-activity-total">
        <span className="kpi-value">{total}</span>
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
