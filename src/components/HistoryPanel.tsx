import { useState } from 'react'
import { Card } from './ui/Card'
import { PillButton } from './ui/PillButton'
import { todayISODate } from '../lib/calculations'
import { formatCurrency, formatMonthYearLabel } from '../lib/format'
import { newId } from '../lib/id'
import type { HistoryEntry } from '../types'

interface Props {
  history: HistoryEntry[]
  onChange: (history: HistoryEntry[]) => void
}

export function HistoryPanel({ history, onChange }: Props) {
  const sorted = [...history].sort((a, b) => a.monthYear.localeCompare(b.monthYear))

  // Monat eines bestehenden Eintrags wird erst nach Bestätigen übernommen (analog zum
  // Datumsfeld in Termin-Pipeline/Deal-Liste) - selbes Problem: das native Monatsfeld zeigt
  // sonst inkonsistent formatierte Werte (z.B. englische Monatsnamen) und ein versehentliches
  // Übernehmen beim Navigieren im nativen Picker ist möglich, bevor bewusst ein Monat
  // ausgewählt wurde.
  const [editingMonthEntryIds, setEditingMonthEntryIds] = useState<Set<string>>(new Set())
  const [monthDrafts, setMonthDrafts] = useState<Record<string, string>>({})

  const update = (id: string, patch: Partial<HistoryEntry>) =>
    onChange(history.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)))

  const remove = (id: string) => onChange(history.filter((entry) => entry.id !== id))

  // Startet mit dem aktuellen Monat statt leer - ein leerer Wert ließe sich in der neuen
  // Anzeige-Darstellung nicht sinnvoll formatieren (siehe formatMonthYearLabel-Fallback unten).
  const add = () => onChange([...history, { id: newId(), monthYear: todayISODate().slice(0, 7), target: 0, achieved: 0 }])

  const startEditMonth = (entry: HistoryEntry) => {
    setEditingMonthEntryIds((prev) => new Set(prev).add(entry.id))
    setMonthDrafts((prev) => ({ ...prev, [entry.id]: entry.monthYear }))
  }
  const cancelEditMonth = (id: string) => {
    setEditingMonthEntryIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setMonthDrafts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }
  const confirmEditMonth = (entry: HistoryEntry) => {
    const monthYear = monthDrafts[entry.id] ?? entry.monthYear
    update(entry.id, { monthYear })
    cancelEditMonth(entry.id)
  }

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
              <td data-label="Monat/Jahr">
                {editingMonthEntryIds.has(entry.id) ? (
                  <div className="pipeline-deal-action">
                    <div className="pipeline-date-field">
                      <input
                        type="month"
                        value={monthDrafts[entry.id] ?? entry.monthYear}
                        onChange={(e) => setMonthDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                      />
                    </div>
                    <PillButton type="button" onClick={() => confirmEditMonth(entry)}>
                      Bestätigen
                    </PillButton>
                    <PillButton variant="ghost" type="button" onClick={() => cancelEditMonth(entry.id)}>
                      Abbrechen
                    </PillButton>
                  </div>
                ) : (
                  <PillButton variant="muted" type="button" onClick={() => startEditMonth(entry)}>
                    {entry.monthYear ? formatMonthYearLabel(entry.monthYear) : 'Monat wählen'} ✎
                  </PillButton>
                )}
              </td>
              <td data-label="Ziel">
                <input
                  type="number"
                  value={entry.target}
                  min={0}
                  step={500}
                  onChange={(e) => update(entry.id, { target: e.target.valueAsNumber || 0 })}
                />
              </td>
              <td data-label="Erreicht">
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
