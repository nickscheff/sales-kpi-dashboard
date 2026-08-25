import { Card } from './ui/Card'
import { PillButton } from './ui/PillButton'
import { formatCurrency } from '../lib/format'
import { newId } from '../lib/id'
import type { HistoryEntry } from '../types'

interface Props {
  history: HistoryEntry[]
  onChange: (history: HistoryEntry[]) => void
}

export function HistoryPanel({ history, onChange }: Props) {
  const sorted = [...history].sort((a, b) => a.monthYear.localeCompare(b.monthYear))

  const update = (id: string, patch: Partial<HistoryEntry>) =>
    onChange(history.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)))

  const remove = (id: string) => onChange(history.filter((entry) => entry.id !== id))

  const add = () => onChange([...history, { id: newId(), monthYear: '', target: 0, achieved: 0 }])

  const highest = sorted.length > 0 ? Math.max(...sorted.map((entry) => entry.achieved)) : null

  return (
    <Card title="Monats-Historie" subtitle="Vergangene Monate, manuell gepflegt" className="span-2">
      <table className="table">
        <thead>
          <tr>
            <th>Monat/Jahr</th>
            <th>Ziel</th>
            <th>Erreicht</th>
            <th aria-hidden="true"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((entry) => (
            <tr key={entry.id}>
              <td>
                <input type="month" value={entry.monthYear} onChange={(e) => update(entry.id, { monthYear: e.target.value })} />
              </td>
              <td>
                <input
                  type="number"
                  value={entry.target}
                  min={0}
                  step={500}
                  onChange={(e) => update(entry.id, { target: e.target.valueAsNumber || 0 })}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={entry.achieved}
                  min={0}
                  step={500}
                  onChange={(e) => update(entry.id, { achieved: e.target.valueAsNumber || 0 })}
                />
              </td>
              <td>
                <PillButton variant="ghost" type="button" onClick={() => remove(entry.id)} aria-label="Eintrag entfernen">
                  ✕
                </PillButton>
              </td>
            </tr>
          ))}
          {sorted.length === 0 && (
            <tr>
              <td colSpan={4} className="table-empty">Noch keine vergangenen Monate erfasst.</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="history-footer">
        <PillButton type="button" onClick={add}>+ Monat hinzufügen</PillButton>
        {highest !== null && <span className="history-hint">Bisheriger Rekord: {formatCurrency(highest)}</span>}
      </div>
    </Card>
  )
}
