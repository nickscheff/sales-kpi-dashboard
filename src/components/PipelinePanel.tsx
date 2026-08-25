import { useState } from 'react'
import { Card } from './ui/Card'
import { Collapsible } from './ui/Collapsible'
import { PillButton } from './ui/PillButton'
import { OPEN_PIPELINE_LABELS, PIPELINE_LABELS, getPipelineSummary, todayISODate } from '../lib/calculations'
import { newId } from '../lib/id'
import type { PipelineEntry, PipelineLabel } from '../types'

interface Props {
  pipeline: PipelineEntry[]
  onChange: (pipeline: PipelineEntry[]) => void
  onCreateDeal: (entry: PipelineEntry, revenue: number) => void
}

export function PipelinePanel({ pipeline, onChange, onCreateDeal }: Props) {
  const [dealRevenueDrafts, setDealRevenueDrafts] = useState<Record<string, number>>({})

  const summary = getPipelineSummary(pipeline)
  const open = pipeline
    .filter((entry) => OPEN_PIPELINE_LABELS.includes(entry.label))
    .sort((a, b) => a.date.localeCompare(b.date))
  const closed = pipeline
    .filter((entry) => !OPEN_PIPELINE_LABELS.includes(entry.label))
    .sort((a, b) => b.date.localeCompare(a.date))

  const hasPendingClosedDeal = closed.some((entry) => entry.label === 'Closed Deal' && !entry.dealCreated)
  const [abgeschlossenOpen, setAbgeschlossenOpen] = useState(hasPendingClosedDeal)
  const [prevHasPendingClosedDeal, setPrevHasPendingClosedDeal] = useState(hasPendingClosedDeal)

  // State während des Renderns anpassen (statt useEffect, siehe React-Doku "Adjusting
  // state when a prop changes"): klappt "Abgeschlossen" automatisch auf, sobald ein
  // unbestätigter Closed Deal auftaucht (z.B. weil ein offener Termin auf "Closed Deal"
  // umgestellt wurde), damit die Übernahme-Aktion nicht in einem zugeklappten Bereich
  // verschwindet. Reagiert nur auf den Wechsel false→true; ein manuelles Zuklappen bleibt
  // bestehen, solange sich hasPendingClosedDeal nicht ändert.
  if (hasPendingClosedDeal !== prevHasPendingClosedDeal) {
    setPrevHasPendingClosedDeal(hasPendingClosedDeal)
    if (hasPendingClosedDeal) setAbgeschlossenOpen(true)
  }

  const updateEntry = (id: string, patch: Partial<PipelineEntry>) =>
    onChange(pipeline.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)))

  const remove = (id: string) => onChange(pipeline.filter((entry) => entry.id !== id))

  const add = () =>
    onChange([...pipeline, { id: newId(), date: todayISODate(), label: 'Discovery Call', company: '' }])

  const setDraft = (id: string, value: number) => setDealRevenueDrafts((prev) => ({ ...prev, [id]: value }))

  const submitDeal = (entry: PipelineEntry) => {
    const revenue = dealRevenueDrafts[entry.id] ?? 0
    if (revenue <= 0) return
    onCreateDeal(entry, revenue)
    setDealRevenueDrafts((prev) => {
      const next = { ...prev }
      delete next[entry.id]
      return next
    })
  }

  const renderRow = (entry: PipelineEntry, withAction: boolean) => (
    <tr key={entry.id}>
      <td>
        <input type="date" value={entry.date} onChange={(e) => updateEntry(entry.id, { date: e.target.value })} />
      </td>
      <td>
        <input
          type="text"
          value={entry.company ?? ''}
          placeholder="Firma (optional)"
          onChange={(e) => updateEntry(entry.id, { company: e.target.value })}
        />
      </td>
      <td>
        <select value={entry.label} onChange={(e) => updateEntry(entry.id, { label: e.target.value as PipelineLabel })}>
          {PIPELINE_LABELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </td>
      {withAction && (
        <td>
          {entry.label === 'Closed Deal' && entry.dealCreated && <span className="deal-taken-hint">✓ Deal angelegt</span>}
          {entry.label === 'Closed Deal' && !entry.dealCreated && (
            <div className="pipeline-deal-action">
              <input
                type="number"
                min={0}
                step={100}
                placeholder="Umsatz €"
                value={dealRevenueDrafts[entry.id] ?? ''}
                onChange={(e) => setDraft(entry.id, e.target.valueAsNumber || 0)}
              />
              <PillButton
                type="button"
                onClick={() => submitDeal(entry)}
                disabled={(dealRevenueDrafts[entry.id] ?? 0) <= 0}
              >
                ✓ Übernehmen
              </PillButton>
            </div>
          )}
        </td>
      )}
      <td>
        <PillButton variant="ghost" type="button" onClick={() => remove(entry.id)} aria-label="Eintrag entfernen">
          ✕
        </PillButton>
      </td>
    </tr>
  )

  return (
    <Card title="Termin-Pipeline" subtitle="Gebuchte Termine nach Ausgang, dieser Monat" className="span-2">
      <div className="pipeline-summary">
        {summary.map((item) => (
          <span className="pipeline-chip" key={item.label}>
            {item.count} {item.label}
            {item.isOpen ? ' offen' : ''}
          </span>
        ))}
      </div>

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Firma</th>
              <th>Label</th>
              <th aria-hidden="true"></th>
            </tr>
          </thead>
          <tbody>
            {open.map((entry) => renderRow(entry, false))}
            {open.length === 0 && (
              <tr>
                <td colSpan={4} className="table-empty">
                  Keine offenen Termine in diesem Monat.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PillButton type="button" onClick={add}>
        + Termin hinzufügen
      </PillButton>

      <Collapsible
        title={`Abgeschlossen (${closed.length})`}
        open={abgeschlossenOpen}
        onOpenChange={setAbgeschlossenOpen}
        className="pipeline-closed"
      >
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>Datum</th>
                <th>Firma</th>
                <th>Label</th>
                <th>Aktion</th>
                <th aria-hidden="true"></th>
              </tr>
            </thead>
            <tbody>
              {closed.map((entry) => renderRow(entry, true))}
              {closed.length === 0 && (
                <tr>
                  <td colSpan={5} className="table-empty">
                    Noch keine abgeschlossenen Termine in diesem Monat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Collapsible>
    </Card>
  )
}
