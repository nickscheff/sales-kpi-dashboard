import { useState } from 'react'
import { Card } from './ui/Card'
import { PillButton } from './ui/PillButton'
import { PIPELINE_LABELS, getPipelineSummary, todayISODate } from '../lib/calculations'
import type { PipelineEntry, PipelineLabel } from '../types'

interface Props {
  pipeline: PipelineEntry[]
  onChange: (pipeline: PipelineEntry[]) => void
}

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`
}

export function PipelinePanel({ pipeline, onChange }: Props) {
  const [date, setDate] = useState(todayISODate())
  const [label, setLabel] = useState<PipelineLabel>('Discovery Call')

  const summary = getPipelineSummary(pipeline)
  const sorted = [...pipeline].sort((a, b) => b.date.localeCompare(a.date))

  const add = () => {
    if (!date) return
    onChange([...pipeline, { id: newId(), date, label }])
  }

  const remove = (id: string) => onChange(pipeline.filter((entry) => entry.id !== id))

  return (
    <Card title="Termin-Pipeline" subtitle="Gebuchte Termine nach Ausgang" className="span-2">
      <div className="pipeline-summary">
        {summary.map((item) => (
          <span className="pipeline-chip" key={item.label}>
            {item.count} {item.label}
            {item.isOpen ? ' offen' : ''}
          </span>
        ))}
      </div>

      <div className="pipeline-form">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <select value={label} onChange={(e) => setLabel(e.target.value as PipelineLabel)}>
          {PIPELINE_LABELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <PillButton type="button" onClick={add}>
          + Hinzufügen
        </PillButton>
      </div>

      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Label</th>
              <th aria-hidden="true"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.date}</td>
                <td>{entry.label}</td>
                <td>
                  <PillButton variant="ghost" type="button" onClick={() => remove(entry.id)} aria-label="Eintrag entfernen">
                    ✕
                  </PillButton>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={3} className="table-empty">
                  Noch keine Termine erfasst.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
