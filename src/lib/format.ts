const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  maximumFractionDigits: 1,
})

const monthYearFormatter = new Intl.DateTimeFormat('de-DE', { month: 'long', year: 'numeric' })

function safe(value: number): number {
  return Number.isFinite(value) ? value : 0
}

export function formatCurrency(value: number): string {
  return currencyFormatter.format(safe(value))
}

export function formatPercent(value: number): string {
  return percentFormatter.format(safe(value))
}

export function formatNumber(value: number, decimals = 1): string {
  return new Intl.NumberFormat('de-DE', {
    maximumFractionDigits: decimals,
    minimumFractionDigits: 0,
  }).format(safe(value))
}

/** "YYYY-MM" -> z.B. "August 2026". */
export function formatMonthYearLabel(monthYear: string): string {
  const [year, month] = monthYear.split('-').map(Number)
  return monthYearFormatter.format(new Date(year, month - 1, 1))
}

/** Kurzform "TT.MM." für kompakte mobile Übersichtszeilen - reine String-Operation auf
 * dem ISO-Datum, kein Date-Objekt/Zeitzonen-Umweg nötig. */
export function formatShortDate(iso: string): string {
  const [, month, day] = iso.split('-')
  return `${day}.${month}.`
}

/** Vollform "TT.MM.JJJJ" für die Datum-Anzeige im Bestätigen-Schritt - ebenfalls reine
 * String-Operation, kein Date-Objekt/Zeitzonen-Umweg nötig. */
export function formatFullDate(iso: string): string {
  const [year, month, day] = iso.split('-')
  return `${day}.${month}.${year}`
}

/** "2026-Q4" -> "Q4 2026". */
export function formatQuarterLabel(quarterLabel: string): string {
  const [year, quarter] = quarterLabel.split('-')
  return `${quarter} ${year}`
}
