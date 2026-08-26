import { PillButton } from './ui/PillButton'
import { shiftMonthYear } from '../lib/calculations'
import { formatMonthYearLabel } from '../lib/format'

interface Props {
  monthYear: string
  onChangeMonthYear: (monthYear: string) => void
}

export function MonthSwitcher({ monthYear, onChangeMonthYear }: Props) {
  return (
    <div className="month-switcher">
      <PillButton
        variant="ghost"
        type="button"
        onClick={() => onChangeMonthYear(shiftMonthYear(monthYear, -1))}
        aria-label="Vorheriger Monat"
      >
        ‹
      </PillButton>
      <span className="month-switcher-label">{formatMonthYearLabel(monthYear)}</span>
      <PillButton
        variant="ghost"
        type="button"
        onClick={() => onChangeMonthYear(shiftMonthYear(monthYear, 1))}
        aria-label="Nächster Monat"
      >
        ›
      </PillButton>
    </div>
  )
}
