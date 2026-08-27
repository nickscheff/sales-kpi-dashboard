import { Fragment, useState } from 'react'
import { Card } from './ui/Card'
import { Collapsible } from './ui/Collapsible'
import { PillButton } from './ui/PillButton'
import {
  CLOSED_PIPELINE_LABELS,
  LOST_LEAD_STALE_MONTHS,
  OPEN_PIPELINE_LABELS,
  PIPELINE_LABELS,
  REACTIVATABLE_PIPELINE_LABELS,
  getPipelineSummary,
  getStaleLostLeads,
  groupOpenPipelineByDate,
  isRealCurrentMonth,
  todayISODate,
} from '../lib/calculations'
import { formatFullDate, formatShortDate } from '../lib/format'
import { newId } from '../lib/id'
import type { PipelineEntry, PipelineLabel } from '../types'

interface Props {
  pipeline: PipelineEntry[]
  /** Vollständige, ungefilterte Pipeline (alle Monate) - für den Lost-Lead-Reminder. */
  allMonthsPipeline: PipelineEntry[]
  /** Aktuell im Monats-Schalter gewählter Monat - bestimmt den Klapp-Start-Zustand des
   * monatsbezogenen Hauptinhalts (siehe monthContentOpen weiter unten). */
  monthYear: string
  onChange: (pipeline: PipelineEntry[]) => void
  onCreateDeal: (entry: PipelineEntry, revenue: number) => void
  onReachOutToLostLead: (entry: PipelineEntry, date: string) => void
  onDismissStaleLead: (entry: PipelineEntry) => void
}

type Section = 'open' | 'noShow' | 'closed'

const FOLLOW_UP_DEFAULT_OFFSET_DAYS = 7

function defaultFollowUpDate(): string {
  return todayISODate(new Date(Date.now() + FOLLOW_UP_DEFAULT_OFFSET_DAYS * 24 * 60 * 60 * 1000))
}

export function PipelinePanel({
  pipeline,
  allMonthsPipeline,
  monthYear,
  onChange,
  onCreateDeal,
  onReachOutToLostLead,
  onDismissStaleLead,
}: Props) {
  const [dealRevenueDrafts, setDealRevenueDrafts] = useState<Record<string, number>>({})
  const [closingEntryIds, setClosingEntryIds] = useState<Set<string>>(new Set())
  const [reactivatingEntryIds, setReactivatingEntryIds] = useState<Set<string>>(new Set())
  const [reactivateDateDrafts, setReactivateDateDrafts] = useState<Record<string, string>>({})
  const [planningFollowUpEntryIds, setPlanningFollowUpEntryIds] = useState<Set<string>>(new Set())
  const [followUpDateDrafts, setFollowUpDateDrafts] = useState<Record<string, string>>({})
  const [reachingOutEntryIds, setReachingOutEntryIds] = useState<Set<string>>(new Set())
  const [reachOutDateDrafts, setReachOutDateDrafts] = useState<Record<string, string>>({})

  // Datum eines bestehenden Eintrags wird erst nach Bestätigen übernommen (analog zu
  // Reaktivieren/Folgetermin/Neuer Termin) - verhindert, dass beim Navigieren im
  // nativen Kalender auf dem Handy versehentlich schon ein Datum übernommen wird, bevor
  // bewusst ein Tag ausgewählt wurde. Gilt für alle drei Tabellen, auf allen Bildschirmgrößen.
  const [editingDateEntryIds, setEditingDateEntryIds] = useState<Set<string>>(new Set())
  const [dateDrafts, setDateDrafts] = useState<Record<string, string>>({})

  // Akkordeon für die mobile Kartenansicht (CSS-seitig auf Desktop/Tablet komplett
  // wirkungslos, siehe .pipeline-row-summary in App.css). Einzelwert statt Set, damit "nur
  // eine Karte gleichzeitig offen" automatisch gilt - ein eigener State pro Bereich, damit
  // die drei Bereiche unabhängig voneinander jeweils eine eigene aufgeklappte Karte haben
  // können.
  const [expandedOpenEntryId, setExpandedOpenEntryId] = useState<string | null>(null)
  const [expandedNoShowEntryId, setExpandedNoShowEntryId] = useState<string | null>(null)
  const [expandedClosedEntryId, setExpandedClosedEntryId] = useState<string | null>(null)

  const staleLostLeads = getStaleLostLeads(allMonthsPipeline, LOST_LEAD_STALE_MONTHS)
  // Zwei unabhängige Filter-States statt einem gemeinsamen: die obere Leiste filtert nur
  // Offen, die eigene Mini-Leiste über "Abgeschlossen" nur diese Tabelle. No-Show/Cancel
  // hat keinen Filter (die Tabelle enthält ohnehin immer nur dieses eine Label).
  const [openLabelFilter, setOpenLabelFilter] = useState<PipelineLabel | null>(null)
  const [closedLabelFilter, setClosedLabelFilter] = useState<PipelineLabel | null>(null)

  const summary = getPipelineSummary(pipeline)
  const openSummary = summary.filter((item) => OPEN_PIPELINE_LABELS.includes(item.label))
  const closedSummary = summary.filter((item) => CLOSED_PIPELINE_LABELS.includes(item.label))

  const openAll = pipeline.filter((entry) => OPEN_PIPELINE_LABELS.includes(entry.label)).sort((a, b) => a.date.localeCompare(b.date))
  const noShowAll = pipeline
    .filter((entry) => REACTIVATABLE_PIPELINE_LABELS.includes(entry.label))
    .sort((a, b) => b.date.localeCompare(a.date))
  const closedAll = pipeline.filter((entry) => CLOSED_PIPELINE_LABELS.includes(entry.label)).sort((a, b) => b.date.localeCompare(a.date))

  const open = openLabelFilter ? openAll.filter((e) => e.label === openLabelFilter) : openAll
  const openGroups = groupOpenPipelineByDate(open)
  const noShow = noShowAll
  const closed = closedLabelFilter ? closedAll.filter((e) => e.label === closedLabelFilter) : closedAll

  const hasPendingClosedDeal = closedAll.some((entry) => entry.label === 'Closed Deal' && !entry.dealCreated)
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

  // Monatsbezogener Hauptinhalt (Offen/No-Show-Cancel/Abgeschlossen, ohne den Lost-Lead-
  // Reminder - der zeigt Leads aus allen Monaten und bleibt davon unberührt) ist nur im
  // echten aktuellen Kalendermonat standardmäßig ausgeklappt. State während des Renderns
  // anpassen (gleiches Muster wie oben bei abgeschlossenOpen): bei jedem Monatswechsel wird
  // der Klapp-Zustand auf den Standard für den neuen Monat zurückgesetzt - das ist nur der
  // Startzustand, ein manuelles Umschalten bleibt bis zum nächsten Monatswechsel bestehen.
  const isCurrentMonth = isRealCurrentMonth(monthYear)
  const [monthContentOpen, setMonthContentOpen] = useState(isCurrentMonth)
  const [prevMonthYear, setPrevMonthYear] = useState(monthYear)
  if (monthYear !== prevMonthYear) {
    setPrevMonthYear(monthYear)
    setMonthContentOpen(isCurrentMonth)
  }

  const updateEntry = (id: string, patch: Partial<PipelineEntry>) =>
    onChange(pipeline.map((entry) => (entry.id === id ? { ...entry, ...patch } : entry)))

  const remove = (id: string) => onChange(pipeline.filter((entry) => entry.id !== id))

  const add = () =>
    onChange([...pipeline, { id: newId(), date: todayISODate(), label: 'Discovery Call', company: '' }])

  const toggleOpenFilter = (label: PipelineLabel) => setOpenLabelFilter((prev) => (prev === label ? null : label))
  const resetOpenFilter = () => setOpenLabelFilter(null)

  // Kein Zuklappen, solange die Karte mitten in einem Bestätigen/Abbrechen-Zwischenschritt
  // steckt (Umsatz-/Datum-Eingabe) - sie bleibt zwangsweise aufgeklappt (siehe isExpanded in
  // renderRow), ein Tap auf die Übersichtszeile wird dafür hier ignoriert. Raus kommt man nur
  // über den bestehenden "Abbrechen"-Button. Eigener Akkordeon-State pro Bereich (siehe oben).
  const toggleCard = (section: Section, id: string, isMidConfirmation: boolean) => {
    if (isMidConfirmation) return
    const setExpanded = section === 'open' ? setExpandedOpenEntryId : section === 'noShow' ? setExpandedNoShowEntryId : setExpandedClosedEntryId
    setExpanded((prev) => (prev === id ? null : id))
  }

  const toggleClosedFilter = (label: PipelineLabel) => {
    const next = closedLabelFilter === label ? null : label
    setClosedLabelFilter(next)
    if (next) setAbgeschlossenOpen(true)
  }
  const resetClosedFilter = () => setClosedLabelFilter(null)

  const setDraft = (id: string, value: number) => setDealRevenueDrafts((prev) => ({ ...prev, [id]: value }))

  const startClosing = (id: string) => setClosingEntryIds((prev) => new Set(prev).add(id))
  const cancelClosing = (id: string) => {
    setClosingEntryIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setDealRevenueDrafts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }
  const confirmDeal = (entry: PipelineEntry) => {
    const revenue = dealRevenueDrafts[entry.id] ?? 0
    if (revenue <= 0) return
    onCreateDeal(entry, revenue)
    cancelClosing(entry.id)
  }

  const startReactivate = (id: string) => {
    setReactivatingEntryIds((prev) => new Set(prev).add(id))
    setReactivateDateDrafts((prev) => ({ ...prev, [id]: todayISODate() }))
  }
  const cancelReactivate = (id: string) => {
    setReactivatingEntryIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setReactivateDateDrafts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }
  const confirmReactivate = (entry: PipelineEntry) => {
    const date = reactivateDateDrafts[entry.id] ?? todayISODate()
    updateEntry(entry.id, { label: 'Discovery Call', date })
    cancelReactivate(entry.id)
  }

  const startPlanFollowUp = (id: string) => {
    setPlanningFollowUpEntryIds((prev) => new Set(prev).add(id))
    setFollowUpDateDrafts((prev) => ({ ...prev, [id]: defaultFollowUpDate() }))
  }
  const cancelPlanFollowUp = (id: string) => {
    setPlanningFollowUpEntryIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setFollowUpDateDrafts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }
  const confirmPlanFollowUp = (entry: PipelineEntry) => {
    const date = followUpDateDrafts[entry.id] ?? defaultFollowUpDate()
    // Ursprungseintrag bleibt unverändert (repräsentiert weiterhin den bereits
    // stattgefundenen Termin) - neuer, unabhängiger Eintrag für den Folgetermin.
    onChange([...pipeline, { id: newId(), date, label: 'Follow-Up Call', company: entry.company }])
    cancelPlanFollowUp(entry.id)
  }

  const startReachOut = (id: string) => {
    setReachingOutEntryIds((prev) => new Set(prev).add(id))
    setReachOutDateDrafts((prev) => ({ ...prev, [id]: todayISODate() }))
  }
  const cancelReachOut = (id: string) => {
    setReachingOutEntryIds((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setReachOutDateDrafts((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }
  const confirmReachOut = (entry: PipelineEntry) => {
    const date = reachOutDateDrafts[entry.id] ?? todayISODate()
    // Eigene Prop statt onChange: der alte Lost-Eintrag liegt i.d.R. in einem anderen
    // Monat als dem gerade gewählten und ist in der monatsgefilterten `pipeline`-Prop
    // nicht enthalten - onReachOutToLostLead arbeitet in App.tsx auf der vollen Liste.
    // Label/Datum des alten Eintrags bleiben unverändert, nur das staleLeadHandled-Flag
    // wird gesetzt (verhindert erneutes Auftauchen im Reminder, keine Verfälschung der
    // damaligen Monats-Statistik).
    onReachOutToLostLead(entry, date)
    cancelReachOut(entry.id)
  }

  const startEditDate = (entry: PipelineEntry) => {
    setEditingDateEntryIds((prev) => new Set(prev).add(entry.id))
    setDateDrafts((prev) => ({ ...prev, [entry.id]: entry.date }))
  }
  const cancelEditDate = (id: string) => {
    setEditingDateEntryIds((prev) => {
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
  const confirmEditDate = (entry: PipelineEntry) => {
    const date = dateDrafts[entry.id] ?? entry.date
    updateEntry(entry.id, { date })
    cancelEditDate(entry.id)
  }

  const renderRow = (entry: PipelineEntry, section: Section) => {
    // Akkordeon gilt einheitlich für alle drei Bereiche (Lost-Lead-Reminder nutzt renderRow
    // nicht und bleibt unverändert immer voll ausgeklappt), jeweils mit eigenem Akkordeon-
    // State pro Bereich (siehe expandedOpenEntryId/expandedNoShowEntryId/expandedClosedEntryId
    // oben) - "nur eine Karte offen" gilt dadurch unabhängig je Bereich.
    const expandedEntryId = section === 'open' ? expandedOpenEntryId : section === 'noShow' ? expandedNoShowEntryId : expandedClosedEntryId
    const isMidConfirmation =
      closingEntryIds.has(entry.id) ||
      planningFollowUpEntryIds.has(entry.id) ||
      reactivatingEntryIds.has(entry.id) ||
      editingDateEntryIds.has(entry.id)
    const isExpanded = expandedEntryId === entry.id || isMidConfirmation
    const detailClassName = 'pipeline-row-detail'

    return (
    <tr
      key={entry.id}
      className="pipeline-row-collapsible"
      data-expanded={String(isExpanded)}
    >
      <td className="pipeline-row-summary">
        <button
          type="button"
          className="pipeline-row-summary-toggle"
          onClick={() => toggleCard(section, entry.id, isMidConfirmation)}
          aria-expanded={isExpanded}
        >
          <span className="pipeline-row-summary-main">
            <span className="pipeline-row-summary-company">{entry.company || '–'}</span>
            <span className="pipeline-row-summary-meta">
              {formatShortDate(entry.date)} · {entry.label}
            </span>
          </span>
          <span className="pipeline-row-summary-chevron" aria-hidden="true">
            {isExpanded ? '▾' : '▸'}
          </span>
        </button>
      </td>
      <td data-label="Datum" className={detailClassName}>
        {editingDateEntryIds.has(entry.id) ? (
          <div className="pipeline-deal-action">
            <div className="pipeline-date-field">
              <input
                type="date"
                value={dateDrafts[entry.id] ?? entry.date}
                onChange={(e) => setDateDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))}
              />
            </div>
            <PillButton type="button" onClick={() => confirmEditDate(entry)}>
              Bestätigen
            </PillButton>
            <PillButton variant="ghost" type="button" onClick={() => cancelEditDate(entry.id)}>
              Abbrechen
            </PillButton>
          </div>
        ) : (
          <PillButton variant="muted" type="button" onClick={() => startEditDate(entry)}>
            {formatFullDate(entry.date)} ✎
          </PillButton>
        )}
      </td>
      <td data-label="Firma" className={detailClassName}>
        <input
          type="text"
          value={entry.company ?? ''}
          placeholder="Firma (optional)"
          onChange={(e) => updateEntry(entry.id, { company: e.target.value })}
        />
      </td>
      <td data-label="Label" className={detailClassName}>
        <select value={entry.label} onChange={(e) => updateEntry(entry.id, { label: e.target.value as PipelineLabel })}>
          {PIPELINE_LABELS.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </td>
      <td data-label="Aktion" className={detailClassName}>
        {section === 'open' &&
          (closingEntryIds.has(entry.id) ? (
            <div className="pipeline-deal-action">
              <input
                type="number"
                min={0}
                step={100}
                placeholder="Umsatz €"
                value={dealRevenueDrafts[entry.id] ?? ''}
                onChange={(e) => setDraft(entry.id, e.target.valueAsNumber || 0)}
              />
              <PillButton type="button" onClick={() => confirmDeal(entry)} disabled={(dealRevenueDrafts[entry.id] ?? 0) <= 0}>
                Bestätigen
              </PillButton>
              <PillButton variant="ghost" type="button" onClick={() => cancelClosing(entry.id)}>
                Abbrechen
              </PillButton>
            </div>
          ) : planningFollowUpEntryIds.has(entry.id) ? (
            <div className="pipeline-deal-action">
              <span className="field-label">Folgetermin am</span>
              <input
                type="date"
                value={followUpDateDrafts[entry.id] ?? defaultFollowUpDate()}
                onChange={(e) => setFollowUpDateDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))}
              />
              <PillButton type="button" onClick={() => confirmPlanFollowUp(entry)}>
                Bestätigen
              </PillButton>
              <PillButton variant="ghost" type="button" onClick={() => cancelPlanFollowUp(entry.id)}>
                Abbrechen
              </PillButton>
            </div>
          ) : (
            <div className="pipeline-deal-action">
              <PillButton type="button" onClick={() => startClosing(entry.id)}>
                ✓ Deal abschließen
              </PillButton>
              <PillButton type="button" onClick={() => startPlanFollowUp(entry.id)}>
                → Folgetermin planen
              </PillButton>
            </div>
          ))}
        {section === 'noShow' &&
          (reactivatingEntryIds.has(entry.id) ? (
            <div className="pipeline-deal-action">
              <span className="field-label">Neuer Termin am</span>
              <input
                type="date"
                value={reactivateDateDrafts[entry.id] ?? todayISODate()}
                onChange={(e) => setReactivateDateDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))}
              />
              <PillButton type="button" onClick={() => confirmReactivate(entry)}>
                Bestätigen
              </PillButton>
              <PillButton variant="ghost" type="button" onClick={() => cancelReactivate(entry.id)}>
                Abbrechen
              </PillButton>
            </div>
          ) : (
            <PillButton type="button" onClick={() => startReactivate(entry.id)}>
              ↺ Reaktivieren
            </PillButton>
          ))}
        {section === 'closed' && (
          <>
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
                  onClick={() => confirmDeal(entry)}
                  disabled={(dealRevenueDrafts[entry.id] ?? 0) <= 0}
                >
                  ✓ Übernehmen
                </PillButton>
              </div>
            )}
          </>
        )}
      </td>
      <td className={detailClassName}>
        <PillButton variant="ghost" type="button" onClick={() => remove(entry.id)} aria-label="Eintrag entfernen">
          ✕
        </PillButton>
      </td>
    </tr>
    )
  }

  return (
    <Card title="Termin-Pipeline" subtitle="Gebuchte Termine nach Ausgang, dieser Monat" className="span-2">
      {staleLostLeads.length > 0 && (
        <div className="lost-lead-reminder">
          <h3 className="pipeline-section-title">⏰ Alte Lost-Leads erneut anrufen ({staleLostLeads.length})</h3>
          <div className="table-scroll">
            <table className="table">
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Firma</th>
                  <th>Aktion</th>
                </tr>
              </thead>
              <tbody>
                {staleLostLeads.map((entry) => (
                  <tr key={entry.id}>
                    <td data-label="Datum">{entry.date}</td>
                    <td data-label="Firma">{entry.company || '–'}</td>
                    <td data-label="Aktion">
                      {reachingOutEntryIds.has(entry.id) ? (
                        <div className="pipeline-deal-action">
                          <span className="field-label">Neuer Termin am</span>
                          <input
                            type="date"
                            value={reachOutDateDrafts[entry.id] ?? todayISODate()}
                            onChange={(e) => setReachOutDateDrafts((prev) => ({ ...prev, [entry.id]: e.target.value }))}
                          />
                          <PillButton type="button" onClick={() => confirmReachOut(entry)}>
                            Bestätigen
                          </PillButton>
                          <PillButton variant="ghost" type="button" onClick={() => cancelReachOut(entry.id)}>
                            Abbrechen
                          </PillButton>
                        </div>
                      ) : (
                        <div className="pipeline-deal-action">
                          <PillButton type="button" onClick={() => startReachOut(entry.id)}>
                            → Neuer Termin
                          </PillButton>
                          <PillButton variant="ghost" type="button" onClick={() => onDismissStaleLead(entry)}>
                            Weiterhin Lost
                          </PillButton>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <button
        type="button"
        className="pipeline-month-toggle"
        onClick={() => setMonthContentOpen((prev) => !prev)}
        aria-expanded={monthContentOpen}
      >
        <span className="pipeline-month-toggle-chevron" aria-hidden="true">
          {monthContentOpen ? '▾' : '▸'}
        </span>
        {monthContentOpen ? (
          <span className="pipeline-month-toggle-label">Termine dieses Monats</span>
        ) : (
          <span className="pipeline-month-toggle-label">
            {openAll.length} offen · {noShowAll.length} No-Show/Cancel · {closedAll.length} abgeschlossen
          </span>
        )}
      </button>

      {monthContentOpen && (
        <>
          <div className="pipeline-summary">
            <button
              type="button"
              className={`pipeline-chip${openLabelFilter === null ? ' pipeline-chip-active' : ''}`}
              onClick={resetOpenFilter}
            >
              Alle
            </button>
            {openSummary.map((item) => (
              <button
                type="button"
                className={`pipeline-chip${openLabelFilter === item.label ? ' pipeline-chip-active' : ''}`}
                key={item.label}
                onClick={() => toggleOpenFilter(item.label)}
              >
                {item.count} {item.label} offen
              </button>
            ))}
          </div>

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
                {openGroups.map((bucket) => (
                  <Fragment key={bucket.group}>
                    <tr className="table-group-row">
                      <td colSpan={5} className="table-group-heading">
                        {bucket.label}
                      </td>
                    </tr>
                    {bucket.entries.map((entry) => renderRow(entry, 'open'))}
                  </Fragment>
                ))}
                {open.length === 0 && (
                  <tr>
                    <td colSpan={5} className="table-empty">
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

          <h3 className="pipeline-section-title">No-Show / Cancel ({noShowAll.length})</h3>
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
                {noShow.map((entry) => renderRow(entry, 'noShow'))}
                {noShow.length === 0 && (
                  <tr>
                    <td colSpan={5} className="table-empty">
                      Keine No-Show/Cancel-Termine in diesem Monat.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="pipeline-summary pipeline-summary-closed">
            <button
              type="button"
              className={`pipeline-chip${closedLabelFilter === null ? ' pipeline-chip-active' : ''}`}
              onClick={resetClosedFilter}
            >
              Alle
            </button>
            {closedSummary.map((item) => (
              <button
                type="button"
                className={`pipeline-chip${closedLabelFilter === item.label ? ' pipeline-chip-active' : ''}`}
                key={item.label}
                onClick={() => toggleClosedFilter(item.label)}
              >
                {item.count} {item.label}
              </button>
            ))}
          </div>

          <Collapsible
            title={`Abgeschlossen (${closedAll.length})`}
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
                  {closed.map((entry) => renderRow(entry, 'closed'))}
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
        </>
      )}
    </Card>
  )
}
