const currencyFormatter = new Intl.NumberFormat('de-DE', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
})

const percentFormatter = new Intl.NumberFormat('de-DE', {
  style: 'percent',
  maximumFractionDigits: 1,
})

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
