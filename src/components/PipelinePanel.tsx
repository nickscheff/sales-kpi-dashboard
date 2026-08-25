import { Card } from './ui/Card'
import { PillButton } from './ui/PillButton'
import { PIPELINE_LABELS, getPipelineSummary, todayISODate } from '../lib/calculations'
import { newId } from '../lib/id'
import type { PipelineEntry, PipelineLabel } from '../types'

interface Props {
  pipeline: PipelineEntry[]
  onChange: (pipeline: PipelineEntry[]) => void
}

export function PipelinePanel({ pipeline, onChange }: Props) {
  const summary = getPipelineSummary(pipeline)
  const sorted = [...pipeline].sort((a, b) => b.date.localeCompare(a.date))

  const updateEntry = (id: string, patch: Partial<PipelineEntry>) =>
    onChange(pipeline.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)))

  const remove = (id: string) => onChange(pipeline.filter((entry) => entry.id !== id))

  const add = () =>
    onChange([...pipeline, { id: newId(), date: todayISODate(), label: 'Discovery Call', company: '' }])

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
            {sorted.map((entry) => (
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
                  <select
                    value={entry.label}
                    onChange={(e) => updateEntry(entry.id, { label: e.target.value as PipelineLabel })}
                  >
                    {PIPELINE_LABELS.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
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
                <td colSpan={4} className="table-empty">
                  Noch keine Termine in diesem Monat erfasst.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <PillButton type="button" onClick={add}>
        + Termin hinzufügen
      </PillButton>
    </Card>
  )
}
