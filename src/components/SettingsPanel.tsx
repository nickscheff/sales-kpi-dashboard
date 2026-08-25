import { Card } from './ui/Card'
import { NumberField } from './ui/Field'
import type { SelectedMonth, Settings } from '../types'

interface Props {
  selectedMonth: SelectedMonth
  onChangeMonthYear: (monthYear: string) => void
  onChangeSettings: (settings: Settings) => void
}

export function SettingsPanel({ selectedMonth, onChangeMonthYear, onChangeSettings }: Props) {
  const settings = selectedMonth.settings
  const set = <K extends keyof Settings>(key: K, value: number) =>
    onChangeSettings({ ...settings, [key]: value })

  return (
    <Card title="Monats-Einstellungen" subtitle="Basis für alle Berechnungen unten" className="span-2">
      <label className="field">
        <span className="field-label">Monat</span>
        <input
          type="month"
          value={selectedMonth.monthYear}
          onChange={(e) => onChangeMonthYear(e.target.value)}
        />
      </label>
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
