import { newId } from './id'
import type { Deal, DailyActivityEntry, DashboardData, PipelineEntry, Settings } from '../types'

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
    selectedMonth: {
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
    },
    deals: [],
    pipeline: [],
    dailyActivity: [],
    quarterTarget: { quarterLabel: currentQuarterLabel(), target: 150000 },
    yearTarget: { year: new Date().getFullYear(), target: 600000 },
    history: [],
  }
}

/**
 * Normalisiert aus der KV geladene Daten in die aktuelle Struktur. Erkennt am Feld
 * `currentMonth`, ob es sich um das alte Block-Format handelt (Deals/Pipeline/Tages-Zähler
 * fest einem einzigen Monat zugeordnet, vor der Umstellung auf durchgehende, datierte
 * Listen) und überführt es verlustfrei:
 * - Deals ohne `date` (im alten Format gab es noch kein Datumsfeld) bekommen den 1. des
 *   damaligen `currentMonth.monthYear` zugewiesen.
 * - Pipeline-Einträge hatten bereits ein Datum, wandern unverändert in die durchgehende Liste.
 * - Der alte additive Zähler `decisionCallsMade` (einzelne Zahl) wird – falls > 0 – zu einem
 *   einzelnen `DailyActivityEntry` am 1. des damaligen Monats.
 * Bereits im neuen Format gespeicherte Daten werden nur defensiv gegen fehlende Felder
 * abgesichert (falls z.B. ein Teilschreibvorgang unterbrochen wurde). Läuft bei jedem Laden
 * erneut (idempotent) – Persistenz erfolgt wie gehabt erst beim nächsten Speichern.
 */
export function normalizeDashboardData(loaded: unknown): DashboardData {
  if (!loaded || typeof loaded !== 'object') return createDefaultData()

  const raw = loaded as Record<string, unknown>
  const base = createDefaultData()

  if (raw.currentMonth && typeof raw.currentMonth === 'object') {
    const cm = raw.currentMonth as {
      monthYear?: string
      settings?: Partial<Settings>
      deals?: Array<Partial<Deal>>
      pipeline?: PipelineEntry[]
      decisionCallsMade?: number
    }
    const monthYear = cm.monthYear ?? base.selectedMonth.monthYear
    const firstOfMonth = `${monthYear}-01`

    const deals: Deal[] = (cm.deals ?? []).map((deal) => ({
      id: deal.id ?? newId(),
      company: deal.company ?? '',
      revenue: deal.revenue ?? 0,
      date: deal.date ?? firstOfMonth,
    }))

    const pipeline: PipelineEntry[] = cm.pipeline ?? []

    const dailyActivity: DailyActivityEntry[] =
      typeof cm.decisionCallsMade === 'number' && cm.decisionCallsMade !== 0
        ? [{ id: newId(), date: firstOfMonth, count: cm.decisionCallsMade }]
        : []

    return {
      selectedMonth: {
        monthYear,
        settings: { ...base.selectedMonth.settings, ...cm.settings },
      },
      deals,
      pipeline,
      dailyActivity,
      quarterTarget: (raw.quarterTarget as DashboardData['quarterTarget']) ?? base.quarterTarget,
      yearTarget: (raw.yearTarget as DashboardData['yearTarget']) ?? base.yearTarget,
      history: (raw.history as DashboardData['history']) ?? [],
    }
  }

  // Bereits neues Format – defensiv gegen fehlende Felder absichern.
  const selectedMonth = raw.selectedMonth as DashboardData['selectedMonth'] | undefined
  return {
    selectedMonth: selectedMonth
      ? { monthYear: selectedMonth.monthYear, settings: { ...base.selectedMonth.settings, ...selectedMonth.settings } }
      : base.selectedMonth,
    deals: (raw.deals as DashboardData['deals']) ?? [],
    pipeline: (raw.pipeline as DashboardData['pipeline']) ?? [],
    dailyActivity: (raw.dailyActivity as DashboardData['dailyActivity']) ?? [],
    quarterTarget: (raw.quarterTarget as DashboardData['quarterTarget']) ?? base.quarterTarget,
    yearTarget: (raw.yearTarget as DashboardData['yearTarget']) ?? base.yearTarget,
    history: (raw.history as DashboardData['history']) ?? [],
  }
}
