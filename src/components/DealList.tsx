import { useState } from 'react'
import { Collapsible } from './ui/Collapsible'
import { PillButton } from './ui/PillButton'
import { getActualRevenue, todayISODate } from '../lib/calculations'
import { formatCurrency, formatFullDate, formatShortDate } from '../lib/format'
import { newId } from '../lib/id'
import type { Deal } from '../types'

interface Props {
  deals: Deal[]
  onChange: (deals: Deal[]) => void
}

export function DealList({ deals, onChange }: Props) {
  const total = getActualRevenue(deals)

  // Datum eines bestehenden Deals wird erst nach Bestätigen übernommen (analog zur
  // Termin-Pipeline) - verhindert, dass beim Navigieren im nativen Kalender auf dem Handy
  // versehentlich schon ein Datum übernommen wird, bevor bewusst ein Tag ausgewählt wurde.
  // Bei der Deal-Liste zusätzlich kritisch, weil dabei auch bereits erfasster Ist-Umsatz
  // dem falschen Monat zugerechnet würde.
  const [editingDateDealIds, setEditingDateDealIds] = useState<Set<string>>(new Set())
  const [dateDrafts, setDateDrafts] = useState<Record<string, string>>({})

  // Akkordeon für die mobile Kartenansicht (CSS-seitig auf Desktop/Tablet komplett
  // wirkungslos, siehe .pipeline-row-summary in App.css). Einzelwert statt Set, damit "nur
  // eine Karte gleichzeitig offen" automatisch gilt. Nutzt bewusst dieselben .pipeline-row-*
  // Klassen wie die Termin-Pipeline (kein Umbenennen des dort bereits laufenden Codes).
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null)

  const updateDeal = (id: string, patch: Partial<Deal>) =>
    onChange(deals.map((deal) => (deal.id === id ? { ...deal, ...patch } : deal)))

  const removeDeal = (id: string) => onChange(deals.filter((deal) => deal.id !== id))

  const addDeal = () => onChange([...deals, { id: newId(), company: '', revenue: 0, date: todayISODate() }])

  // Kein Zuklappen, solange die Karte mitten in der Datum-Bestätigung steckt - sie bleibt
  // zwangsweise aufgeklappt (siehe isExpanded unten), ein Tap auf die Übersichtszeile wird
  // dafür hier ignoriert. Raus kommt man nur über den bestehenden "Abbrechen"-Button.
  const toggleCard = (id: string, isMidConfirmation: boolean) => {
    if (isMidConfirmation) return
    setExpandedDealId((prev) => (prev === id ? null : id))
  }

  const startEditDate = (deal: Deal) => {
    setEditingDateDealIds((prev) => new Set(prev).add(deal.id))
    setDateDrafts((prev) => ({ ...prev, [deal.id]: deal.date }))
  }
  const cancelEditDate = (id: string) => {
    setEditingDateDealIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setDateDrafts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }
  const confirmEditDate = (deal: Deal) => {
    const date = dateDrafts[deal.id] ?? deal.date
    updateDeal(deal.id, { date })
    cancelEditDate(deal.id)
  }

  return (
    <Collapsible
      title={`Deal-Liste (${deals.length}) · ${formatCurrency(total)}`}
      subtitle="Ist-Umsatz = Summe aller Deals im gewählten Monat"
      defaultOpen={false}
      className="span-2"
    >
      <div className="table-scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Datum</th>
              <th>Firma</th>
              <th>Umsatz</th>
              <th aria-hidden="true"></th>
            </tr>
          </thead>
          <tbody>
            {deals.map((deal) => {
              const isMidConfirmation = editingDateDealIds.has(deal.id)
              const isExpanded = expandedDealId === deal.id || isMidConfirmation
              return (
                <tr key={deal.id} className="pipeline-row-collapsible" data-expanded={String(isExpanded)}>
                  <td className="pipeline-row-summary">
                    <button
                      type="button"
                      className="pipeline-row-summary-toggle"
                      onClick={() => toggleCard(deal.id, isMidConfirmation)}
                      aria-expanded={isExpanded}
                    >
                      <span className="pipeline-row-summary-main">
                        <span className="pipeline-row-summary-company">{formatCurrency(deal.revenue)}</span>
                        <span className="pipeline-row-summary-meta">
                          {deal.company || '–'} · {formatShortDate(deal.date)}
                        </span>
                      </span>
                      <span className="pipeline-row-summary-chevron" aria-hidden="true">
                        {isExpanded ? '▾' : '▸'}
                      </span>
                    </button>
                  </td>
                  <td data-label="Datum" className="pipeline-row-detail">
                    {editingDateDealIds.has(deal.id) ? (
                      <div className="pipeline-deal-action">
                        <div className="pipeline-date-field">
                          <input
                            type="date"
                            value={dateDrafts[deal.id] ?? deal.date}
                            onChange={(e) => setDateDrafts((prev) => ({ ...prev, [deal.id]: e.target.value }))}
                          />
                        </div>
                        <PillButton type="button" onClick={() => confirmEditDate(deal)}>
                          Bestätigen
                        </PillButton>
                        <PillButton variant="ghost" type="button" onClick={() => cancelEditDate(deal.id)}>
                          Abbrechen
                        </PillButton>
                      </div>
                    ) : (
                      <PillButton variant="muted" type="button" onClick={() => startEditDate(deal)}>
                        {formatFullDate(deal.date)} ✎
                      </PillButton>
                    )}
                  </td>
                  <td data-label="Firma" className="pipeline-row-detail">
                    <input
                      type="text"
                      value={deal.company}
                      placeholder="Firma"
                      onChange={(e) => updateDeal(deal.id, { company: e.target.value })}
                    />
                  </td>
                  <td data-label="Umsatz" className="pipeline-row-detail">
                    <input
                      type="number"
                      value={deal.revenue}
                      min={0}
                      step={100}
                      onChange={(e) => updateDeal(deal.id, { revenue: e.target.valueAsNumber || 0 })}
                    />
                  </td>
                  <td className="pipeline-row-detail">
                    <PillButton
                      variant="ghost"
                      type="button"
                      onClick={() => removeDeal(deal.id)}
                      aria-label={`${deal.company || 'Deal'} entfernen`}
                    >
                      ✕
                    </PillButton>
                  </td>
                </tr>
              )
            })}
            {deals.length === 0 && (
              <tr>
                <td colSpan={4} className="table-empty">
                  Noch keine Deals in diesem Monat erfasst.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={2}>Ist-Umsatz</td>
              <td colSpan={2}>{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      <PillButton type="button" onClick={addDeal}>
        + Deal hinzufügen
      </PillButton>
    </Collapsible>
  )
}
