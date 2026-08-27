import { useState } from 'react'
import { Card } from './ui/Card'
import { NumberField } from './ui/Field'
import { PillButton } from './ui/PillButton'
import { formatMonthYearLabel } from '../lib/format'
import type { Settings } from '../types'

interface Props {
  monthYear: string
  settings: Settings
  onChangeMonthYear: (monthYear: string) => void
  onChangeSettings: (settings: Settings) => void
}

export function SettingsPanel({ monthYear, settings, onChangeMonthYear, onChangeSettings }: Props) {
  const set = <K extends keyof Settings>(key: K, value: number) =>
    onChangeSettings({ ...settings, [key]: value })

  // Monat wird erst nach Bestätigen übernommen (analog zum Datumsfeld in Termin-Pipeline/
  // Deal-Liste) - selbes Problem: das native Monatsfeld zeigt sonst inkonsistent formatierte
  // Werte (z.B. englische Monatsnamen), und ein versehentliches Übernehmen beim Navigieren im
  // nativen Picker würde hier sofort den gesamten betrachteten Monat wechseln.
  const [editingMonth, setEditingMonth] = useState(false)
  const [monthDraft, setMonthDraft] = useState(monthYear)

  const startEditMonth = () => {
    setMonthDraft(monthYear)
    setEditingMonth(true)
  }
  const cancelEditMonth = () => setEditingMonth(false)
  const confirmEditMonth = () => {
    onChangeMonthYear(monthDraft)
    setEditingMonth(false)
  }

  return (
    <Card title="Monats-Einstellungen" subtitle="Basis für alle Berechnungen unten" className="span-2">
      <div className="field">
        <span className="field-label">Monat</span>
        {editingMonth ? (
          <div className="pipeline-deal-action">
            <div className="pipeline-date-field">
              <input type="month" value={monthDraft} onChange={(e) => setMonthDraft(e.target.value)} />
            </div>
            <PillButton type="button" onClick={confirmEditMonth}>
              Bestätigen
            </PillButton>
            <PillButton variant="ghost" type="button" onClick={cancelEditMonth}>
              Abbrechen
            </PillButton>
          </div>
        ) : (
          <PillButton variant="muted" type="button" onClick={startEditMonth}>
            {formatMonthYearLabel(monthYear)} ✎
          </PillButton>
        )}
      </div>
      <div className="field-grid">
        <NumberField label="Monatsziel" value={settings.monthlyTarget} onChange={(v) => set('monthlyTarget', v)} suffix="€" step={500} />
        <NumberField label="Grundvergütung" value={settings.baseSalary} onChange={(v) => set('baseSalary', v)} suffix="€" step={100} />
        <NumberField label="Ticket-Größe (Ø Deal-Wert)" value={settings.ticketSize} onChange={(v) => set('ticketSize', v)} suffix="€" step={100} />
        <NumberField label="Closing-Rate" value={settings.closingRate} onChange={(v) => set('closingRate', v)} suffix="%" step={1} />
        <NumberField label="No-Show/Cancel-Rate" value={settings.noShowRate} onChange={(v) => set('noShowRate', v)} suffix="%" step={1} />
        <NumberField label="Terminierungsquote" value={settings.bookingRate} onChange={(v) => set('bookingRate', v)} suffix="%" step={1} />
        <NumberField label="Arbeitstage im Monat" value={settings.workDays} onChange={(v) => set('workDays', v)} step={1} />
      </div>
    </Card>
  )
}
