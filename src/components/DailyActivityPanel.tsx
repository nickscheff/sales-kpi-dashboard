import { useState } from 'react'
import { Card } from './ui/Card'
import { PillButton } from './ui/PillButton'
import { todayISODate } from '../lib/calculations'
import type { CatchUpPace } from '../lib/calculations'
import { formatNumber } from '../lib/format'
import { newId } from '../lib/id'
import type { DailyActivityEntry } from '../types'

interface Props {
  entries: DailyActivityEntry[]
  onChange: (entries: DailyActivityEntry[]) => void
  catchUpPace: CatchUpPace
  /** Aktuell in der Soll-Tempo-Karte gewählte Stretch-Goal-Stufe (1/1.25/1.5/2) - reine
   * Anzeige, keine eigene Auswahl hier. */
  paceLevel: number
}

export function DailyActivityPanel({ entries, onChange, catchUpPace, paceLevel }: Props) {
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

      {catchUpPace.isCurrentMonth ? (
        <div className="daily-activity-catchup">
          <p className="pace-hint">Um das {Math.round(paceLevel * 100)}%-Ziel noch zu erreichen, nötig:</p>
          <div className="pace-row">
            <span className="pace-row-label">Heute</span>
            <span className="pace-row-values">{formatNumber(catchUpPace.perDay)} Entscheider-Gespräche</span>
          </div>
          <div className="pace-row">
            <span className="pace-row-label">Diese Woche</span>
            <span className="pace-row-values">{formatNumber(catchUpPace.perWeek)} Entscheider-Gespräche</span>
          </div>
        </div>
      ) : (
        <p className="pace-hint">Aufhol-Werte sind nur für den laufenden Kalendermonat verfügbar.</p>
      )}
    </Card>
  )
}
