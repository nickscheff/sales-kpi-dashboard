import type { CurrentMonth, DashboardData } from '../types'

function currentMonthYear(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function currentQuarterLabel(): string {
  const now = new Date()
  const quarter = Math.ceil((now.getMonth() + 1) / 3)
  return `${now.getFullYear()}-Q${quarter}`
}

export function createDefaultData(): DashboardData {
  return {
    currentMonth: {
      monthYear: currentMonthYear(),
      settings: {
        monthlyTarget: 50000,
        baseSalary: 3000,
        ticketSize: 2500,
        closingRate: 30,
        noShowRate: 15,
        bookingRate: 20,
        workDays: 21,
      },
      deals: [],
      pipeline: [],
      decisionCallsMade: 0,
    },
    quarterTarget: { quarterLabel: currentQuarterLabel(), target: 150000 },
    yearTarget: { year: new Date().getFullYear(), target: 600000 },
    history: [],
  }
}

/**
 * Normalisiert aus der KV geladene Daten in die aktuelle Struktur. Ältere, in der
 * produktiven KV bereits gespeicherte Datensätze kennen `pipeline`/`decisionCallsMade`
 * noch nicht (vor dieser Version) – hier bekommen sie sinnvolle Leer-Defaults, statt dass
 * die App beim Zugriff auf `undefined` crasht. Alle bestehenden Felder (Deals, Settings,
 * Historie, Ziele) werden dabei unverändert übernommen, es gehen keine Daten verloren.
 */
export function normalizeDashboardData(loaded: unknown): DashboardData {
  if (!loaded || typeof loaded !== 'object') return createDefaultData()

  const raw = loaded as Partial<DashboardData> & { currentMonth?: Partial<CurrentMonth> }
  const base = createDefaultData()
  if (!raw.currentMonth) return base

  return {
    currentMonth: {
      monthYear: raw.currentMonth.monthYear ?? base.currentMonth.monthYear,
      settings: { ...base.currentMonth.settings, ...raw.currentMonth.settings },
      deals: raw.currentMonth.deals ?? [],
      pipeline: raw.currentMonth.pipeline ?? [],
      decisionCallsMade: raw.currentMonth.decisionCallsMade ?? 0,
    },
    quarterTarget: raw.quarterTarget ?? base.quarterTarget,
    yearTarget: raw.yearTarget ?? base.yearTarget,
    history: raw.history ?? [],
  }
}
