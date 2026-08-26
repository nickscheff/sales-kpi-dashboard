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

export const DEFAULT_SETTINGS: Settings = {
  monthlyTarget: 50000,
  baseSalary: 3000,
  ticketSize: 2500,
  closingRate: 30,
  noShowRate: 15,
  bookingRate: 20,
  workDays: 21,
}

export function createDefaultData(): DashboardData {
  const monthYear = currentMonthYear()
  return {
    selectedMonth: { monthYear },
    settingsByMonth: { [monthYear]: DEFAULT_SETTINGS },
    deals: [],
    pipeline: [],
    dailyActivity: [],
    quarterTarget: { quarterLabel: currentQuarterLabel(), target: 150000 },
    yearTarget: { year: new Date().getFullYear(), target: 600000 },
    history: [],
  }
}

/**
 * Settings für `monthYear`: exakter Treffer falls vorhanden, sonst die Werte des
 * chronologisch nächstgelegenen VORHERIGEN Monats (String-Vergleich funktioniert für
 * "YYYY-MM" korrekt chronologisch). Ohne jeden Vormonat: App-Defaults. Rein lesend – die
 * zurückgegebenen Werte sind editierbar, aber erst eine tatsächliche Änderung legt über
 * `updateSettings` in App.tsx einen eigenen Eintrag für `monthYear` an.
 */
export function getSettingsForMonth(settingsByMonth: Record<string, Settings>, monthYear: string): Settings {
  if (settingsByMonth[monthYear]) return settingsByMonth[monthYear]
  const previousKeys = Object.keys(settingsByMonth)
    .filter((key) => key < monthYear)
    .sort()
  const closest = previousKeys[previousKeys.length - 1]
  return closest ? settingsByMonth[closest] : DEFAULT_SETTINGS
}

/**
 * Normalisiert aus der KV geladene Daten in die aktuelle Struktur. Erkennt anhand der
 * vorhandenen Felder eine von drei möglichen Formen und migriert verlustfrei:
 * 1. Ältestes Block-Format (`currentMonth`, vor der Umstellung auf durchgehende, datierte
 *    Listen): Deals ohne `date` bekommen den 1. des damaligen `currentMonth.monthYear`,
 *    Pipeline-Einträge wandern unverändert in die durchgehende Liste, der alte additive
 *    Zähler `decisionCallsMade` (falls > 0) wird zu einem einzelnen `DailyActivityEntry`
 *    am 1. des damaligen Monats, die Settings landen in `settingsByMonth[monthYear]`.
 * 2. Vorherige Zwischenform (`selectedMonth.settings` direkt am Filter-Objekt, vor der
 *    Umstellung auf Settings pro Monat): `settings` wird einmalig nach
 *    `settingsByMonth[selectedMonth.monthYear]` verschoben.
 * 3. Bereits aktuelles Format (`settingsByMonth` vorhanden): defensiv gegen fehlende
 *    Felder abgesichert.
 * Läuft bei jedem Laden erneut (idempotent) – Persistenz erfolgt wie gehabt erst beim
 * nächsten Speichern.
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
      selectedMonth: { monthYear },
      settingsByMonth: { [monthYear]: { ...DEFAULT_SETTINGS, ...cm.settings } },
      deals,
      pipeline,
      dailyActivity,
      quarterTarget: (raw.quarterTarget as DashboardData['quarterTarget']) ?? base.quarterTarget,
      yearTarget: (raw.yearTarget as DashboardData['yearTarget']) ?? base.yearTarget,
      history: (raw.history as DashboardData['history']) ?? [],
    }
  }

  const selectedMonthRaw = raw.selectedMonth as { monthYear?: string; settings?: Partial<Settings> } | undefined
  const monthYear = selectedMonthRaw?.monthYear ?? base.selectedMonth.monthYear

  const existingSettingsByMonth = raw.settingsByMonth as Record<string, Settings> | undefined
  const settingsByMonth: Record<string, Settings> = existingSettingsByMonth
    ? existingSettingsByMonth
    : selectedMonthRaw?.settings
      ? { [monthYear]: { ...DEFAULT_SETTINGS, ...selectedMonthRaw.settings } }
      : { [monthYear]: DEFAULT_SETTINGS }

  return {
    selectedMonth: { monthYear },
    settingsByMonth,
    deals: (raw.deals as DashboardData['deals']) ?? [],
    pipeline: (raw.pipeline as DashboardData['pipeline']) ?? [],
    dailyActivity: (raw.dailyActivity as DashboardData['dailyActivity']) ?? [],
    quarterTarget: (raw.quarterTarget as DashboardData['quarterTarget']) ?? base.quarterTarget,
    yearTarget: (raw.yearTarget as DashboardData['yearTarget']) ?? base.yearTarget,
    history: (raw.history as DashboardData['history']) ?? [],
  }
}
