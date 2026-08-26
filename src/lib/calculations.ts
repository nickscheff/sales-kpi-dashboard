import type { DailyActivityEntry, Deal, HistoryEntry, PipelineEntry, PipelineLabel, Settings } from '../types'

/** Prüft, ob ein "YYYY-MM-DD"-Datum in den gegebenen "YYYY-MM"-Monat fällt. */
export function isInMonth(date: string, monthYear: string): boolean {
  return date.slice(0, 7) === monthYear
}

/** 1. Provision & Brutto */

export function getActualRevenue(deals: Deal[]): number {
  return deals.reduce((sum, deal) => sum + deal.revenue, 0)
}

export function getCommission(revenue: number, commissionRatePct: number): number {
  return revenue * (commissionRatePct / 100)
}

/**
 * Provisions-Stufenmodell (Cliff): Der gesamte Ist-Umsatz wird mit dem Satz der höchsten
 * erreichten Stufe verprovisioniert, keine Staffelung pro Abschnitt. `threshold` ist die
 * Zielerreichung als Anteil (0.5 = 50%), ab der der jeweilige Satz gilt.
 */
export interface CommissionTier {
  threshold: number
  rate: number
  label: string
}

export const COMMISSION_TIERS: CommissionTier[] = [
  { threshold: 0, rate: 0, label: 'unter 50% Zielerreichung' },
  { threshold: 0.5, rate: 5, label: 'ab 50% Zielerreichung' },
  { threshold: 1.25, rate: 7, label: 'ab 125% Zielerreichung' },
  { threshold: 1.5, rate: 10, label: 'ab 150% Zielerreichung' },
  { threshold: 2, rate: 12, label: 'ab 200% Zielerreichung' },
]

export function getCommissionTier(achievementPct: number): CommissionTier {
  let applicable = COMMISSION_TIERS[0]
  for (const tier of COMMISSION_TIERS) {
    if (achievementPct >= tier.threshold) {
      applicable = tier
    }
  }
  return applicable
}

export interface NextCommissionTierProgress {
  /** `null`, wenn die höchste Stufe bereits erreicht ist. */
  nextTier: CommissionTier | null
  /** Fehlender Umsatz bis zur Schwelle der nächsten Stufe, 0 falls `nextTier` null ist. */
  amountRemaining: number
  /** Umsatz-Schwelle der nächsten Stufe (Monatsziel × Schwellen-Anteil), 0 falls `nextTier` null ist. */
  requiredRevenue: number
  /** Fortschritt Richtung nächster Schwelle, 0..1. 1, wenn bereits höchste Stufe erreicht. */
  progressPct: number
}

/** Bezieht sich auf den tatsächlichen Ist-Umsatz/die Zielerreichung des Monats, nicht auf Stretch-Goal-Szenarien. */
export function getNextCommissionTierProgress(monthActual: number, monthTarget: number): NextCommissionTierProgress {
  const achievementPct = getAchievementPct(monthActual, monthTarget)
  const currentTier = getCommissionTier(achievementPct)
  const currentIndex = COMMISSION_TIERS.indexOf(currentTier)
  const nextTier = COMMISSION_TIERS[currentIndex + 1] ?? null

  if (!nextTier) {
    return { nextTier: null, amountRemaining: 0, requiredRevenue: 0, progressPct: 1 }
  }

  const requiredRevenue = monthTarget * nextTier.threshold
  const amountRemaining = Math.max(0, requiredRevenue - monthActual)
  const progressPct = requiredRevenue > 0 ? Math.min(1, monthActual / requiredRevenue) : 0

  return { nextTier, amountRemaining, requiredRevenue, progressPct }
}

export function getGrossTotal(baseSalary: number, commission: number): number {
  return baseSalary + commission
}

/** 2. Zielerreichung */

export function getAchievementPct(actual: number, target: number): number {
  if (target <= 0) return 0
  return actual / target
}

export function getMissingRevenue(target: number, actual: number): number {
  return Math.max(0, target - actual)
}

/** 3. Monatsumsatz, Quartals-/Jahresumsatz */

export function monthYearToQuarterLabel(monthYear: string): string {
  const [year, month] = monthYear.split('-').map(Number)
  const quarter = Math.ceil(month / 3)
  return `${year}-Q${quarter}`
}

export function monthYearToYear(monthYear: string): number {
  return Number(monthYear.split('-')[0])
}

/** Verschiebt "YYYY-MM" um `delta` Monate (negativ = zurück, positiv = vor). */
export function shiftMonthYear(monthYear: string, delta: number): string {
  const [year, month] = monthYear.split('-').map(Number)
  const date = new Date(year, month - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Vereinheitlichte Quelle für "erreichter Umsatz je Monat": aus den datierten Deals nach
 * Monat gruppiert, anschließend von manuellen Monats-Historie-Einträgen überschrieben
 * (Override gilt auch für den gerade aktiv gewählten Monat, falls dafür ein
 * Historie-Eintrag existiert). Wird für Ist-Umsatz des gewählten Monats, Quartals-/
 * Jahressumme und Rekord-Vergleich gleichermaßen verwendet.
 */
export function getMonthlyRevenueMap(deals: Deal[], history: HistoryEntry[]): Map<string, number> {
  const map = new Map<string, number>()
  for (const deal of deals) {
    const monthYear = deal.date.slice(0, 7)
    map.set(monthYear, (map.get(monthYear) ?? 0) + deal.revenue)
  }
  for (const entry of history) {
    map.set(entry.monthYear, entry.achieved)
  }
  return map
}

export interface PeriodSum {
  sum: number
  shortfall: number
}

export function getQuarterSum(monthlyRevenueMap: Map<string, number>, quarterLabel: string, quarterTarget: number): PeriodSum {
  let sum = 0
  for (const [monthYear, revenue] of monthlyRevenueMap) {
    if (monthYearToQuarterLabel(monthYear) === quarterLabel) sum += revenue
  }
  return { sum, shortfall: Math.max(0, quarterTarget - sum) }
}

export function getYearSum(monthlyRevenueMap: Map<string, number>, year: number, yearTarget: number): PeriodSum {
  let sum = 0
  for (const [monthYear, revenue] of monthlyRevenueMap) {
    if (monthYearToYear(monthYear) === year) sum += revenue
  }
  return { sum, shortfall: Math.max(0, yearTarget - sum) }
}

/** 4. Rekord-Tracking */

export interface RecordStatus {
  isRecord: boolean
  recordValue: number | null
  diffToRecord: number
}

/** Vergleicht den gewählten Monat gegen den höchsten Wert aller ANDEREN Monate in der Map. */
export function getRecordStatus(monthlyRevenueMap: Map<string, number>, selectedMonthYear: string): RecordStatus {
  const actual = monthlyRevenueMap.get(selectedMonthYear) ?? 0

  let recordValue: number | null = null
  for (const [monthYear, revenue] of monthlyRevenueMap) {
    if (monthYear === selectedMonthYear) continue
    if (recordValue === null || revenue > recordValue) recordValue = revenue
  }

  if (recordValue === null) {
    return { isRecord: actual > 0, recordValue: null, diffToRecord: 0 }
  }
  const isRecord = actual > recordValue
  return { isRecord, recordValue, diffToRecord: isRecord ? 0 : recordValue - actual }
}

/** 5. Stretch-Goal-Szenarien */

export const STRETCH_LEVELS = [1, 1.25, 1.5, 2] as const

export interface StretchScenario {
  level: number
  label: string
  requiredRevenue: number
  openAmount: number
  commissionRate: number
  commissionTierLabel: string
  commission: number
  grossTotal: number
}

export function getStretchScenarios(
  monthlyTarget: number,
  actualRevenue: number,
  settings: Settings,
): StretchScenario[] {
  return STRETCH_LEVELS.map((level) => {
    const requiredRevenue = monthlyTarget * level
    // Das Level *ist* die Zielerreichung, die bei Erreichen dieser Stufe vorliegt.
    const tier = getCommissionTier(level)
    const commission = getCommission(requiredRevenue, tier.rate)
    return {
      level,
      label: level === 1 ? 'Basisziel (100%)' : `${Math.round(level * 100)}%`,
      requiredRevenue,
      openAmount: Math.max(0, requiredRevenue - actualRevenue),
      commissionRate: tier.rate,
      commissionTierLabel: tier.label,
      commission,
      grossTotal: getGrossTotal(settings.baseSalary, commission),
    }
  })
}

/** 6. Trichter-Rückwärtsrechnung */

const WORK_DAYS_PER_WEEK = 5

export interface FunnelStage {
  label: string
  perMonth: number
  perWeek: number
  perDay: number
}

export interface Funnel {
  targetRevenue: number
  deals: FunnelStage
  heldMeetings: FunnelStage
  bookedMeetings: FunnelStage
  decisionCalls: FunnelStage
  /** Gleiche vier Stufen in Anzeige-Reihenfolge, für die Trichter-Tabelle. */
  stages: FunnelStage[]
}

export function getFunnel(targetRevenue: number, settings: Settings): Funnel {
  const dealsCount = settings.ticketSize > 0 ? targetRevenue / settings.ticketSize : 0
  const heldMeetingsCount = settings.closingRate > 0 ? dealsCount / (settings.closingRate / 100) : 0
  const noShowFactor = 1 - settings.noShowRate / 100
  const bookedMeetingsCount = noShowFactor > 0 ? heldMeetingsCount / noShowFactor : 0
  const decisionCallsCount = settings.bookingRate > 0 ? bookedMeetingsCount / (settings.bookingRate / 100) : 0

  const weeksPerMonth = settings.workDays > 0 ? settings.workDays / WORK_DAYS_PER_WEEK : 0

  const toStage = (label: string, perMonth: number): FunnelStage => ({
    label,
    perMonth,
    perWeek: weeksPerMonth > 0 ? perMonth / weeksPerMonth : 0,
    perDay: settings.workDays > 0 ? perMonth / settings.workDays : 0,
  })

  const deals = toStage('Nötige Deals', dealsCount)
  const heldMeetings = toStage('Nötige durchgeführte Termine', heldMeetingsCount)
  const bookedMeetings = toStage('Nötige gebuchte Termine', bookedMeetingsCount)
  const decisionCalls = toStage('Nötige Entscheider-Gespräche', decisionCallsCount)

  return {
    targetRevenue,
    deals,
    heldMeetings,
    bookedMeetings,
    decisionCalls,
    stages: [deals, heldMeetings, bookedMeetings, decisionCalls],
  }
}

/** 7. Termin-Pipeline & Tagesaktivität */

export const PIPELINE_LABELS: PipelineLabel[] = ['Discovery Call', 'Follow-Up Call', 'No-Show/Cancel', 'Lost', 'Closed Deal']

export const OPEN_PIPELINE_LABELS: PipelineLabel[] = ['Discovery Call', 'Follow-Up Call']

/** No-Show/Cancel heißt nur "Termin hat nicht stattgefunden", nicht "Thema erledigt". */
export const REACTIVATABLE_PIPELINE_LABELS: PipelineLabel[] = ['No-Show/Cancel']

export const CLOSED_PIPELINE_LABELS: PipelineLabel[] = ['Lost', 'Closed Deal']

/**
 * Alle Labels außer 'No-Show/Cancel' beschreiben einen Termin, der stattgefunden hat
 * (Discovery/Follow-Up: Ausgang offen, Lost/Closed Deal: Ausgang entschieden).
 */
export const HELD_MEETING_LABELS: PipelineLabel[] = ['Discovery Call', 'Follow-Up Call', 'Lost', 'Closed Deal']

export interface PipelineSummaryItem {
  label: PipelineLabel
  count: number
  isOpen: boolean
}

/** Erwartet bereits auf den gewünschten Monat gefilterte Pipeline-Einträge. */
export function getPipelineSummary(pipeline: PipelineEntry[]): PipelineSummaryItem[] {
  return PIPELINE_LABELS.map((label) => ({
    label,
    count: pipeline.filter((entry) => entry.label === label).length,
    isOpen: OPEN_PIPELINE_LABELS.includes(label),
  }))
}

/**
 * Anzahl durchgeführter Termine, optional nur die vor `beforeDate` (Format "YYYY-MM-DD").
 * Erwartet bereits auf den gewünschten Monat gefilterte Pipeline-Einträge.
 */
export function getHeldMeetingsCount(pipeline: PipelineEntry[], beforeDate?: string): number {
  return pipeline.filter(
    (entry) => HELD_MEETING_LABELS.includes(entry.label) && (beforeDate === undefined || entry.date < beforeDate),
  ).length
}

export function todayISODate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/** Ob `monthYear` dem echten, aktuellen Kalendermonat entspricht. */
export function isRealCurrentMonth(monthYear: string, today: Date = new Date()): boolean {
  return monthYear === todayISODate(today).slice(0, 7)
}

export const LOST_LEAD_STALE_MONTHS = 3

/**
 * "Lost"-Einträge, deren Termin mind. `months` Kalendermonate zurückliegt und die noch
 * nicht erneut kontaktiert wurden - Kandidaten für einen erneuten Reaktivierungs-Anruf.
 * Erwartet die VOLLSTÄNDIGE, ungefilterte Pipeline (nicht nur den gewählten Monat), da der
 * Reminder unabhängig vom gewählten Monat gilt. Älteste zuerst.
 */
export function getStaleLostLeads(pipeline: PipelineEntry[], months: number, today: Date = new Date()): PipelineEntry[] {
  const threshold = todayISODate(new Date(today.getFullYear(), today.getMonth() - months, today.getDate()))
  return pipeline
    .filter((entry) => entry.label === 'Lost' && !entry.reachedOutAgain && entry.date < threshold)
    .sort((a, b) => a.date.localeCompare(b.date))
}

export type OpenPipelineDateGroup = 'overdue' | 'today' | 'tomorrow' | 'thisWeek' | 'later'

const OPEN_PIPELINE_DATE_GROUP_LABELS: Record<OpenPipelineDateGroup, string> = {
  overdue: 'Überfällig',
  today: 'Heute',
  tomorrow: 'Morgen',
  thisWeek: 'Diese Woche',
  later: 'Später',
}

const OPEN_PIPELINE_DATE_GROUP_ORDER: OpenPipelineDateGroup[] = ['overdue', 'today', 'tomorrow', 'thisWeek', 'later']

function addDaysISODate(days: number, today: Date): string {
  return todayISODate(new Date(today.getFullYear(), today.getMonth(), today.getDate() + days))
}

/** Ende der aktuellen Kalenderwoche (Sonntag), als "YYYY-MM-DD". */
function endOfWeekISODate(today: Date): string {
  const dayOfWeek = today.getDay() // 0=So, 1=Mo, ..., 6=Sa
  const daysUntilSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek
  return addDaysISODate(daysUntilSunday, today)
}

export function getOpenPipelineDateGroup(date: string, today: Date = new Date()): OpenPipelineDateGroup {
  const todayISO = todayISODate(today)
  if (date < todayISO) return 'overdue'
  if (date === todayISO) return 'today'
  if (date === addDaysISODate(1, today)) return 'tomorrow'
  if (date <= endOfWeekISODate(today)) return 'thisWeek'
  return 'later'
}

export interface OpenPipelineDateGroupBucket {
  group: OpenPipelineDateGroup
  label: string
  entries: PipelineEntry[]
}

/**
 * Gruppiert bereits (ggf. per Chip) gefilterte Offen-Einträge nach Datum in der
 * Reihenfolge Überfällig → Heute → Morgen → Diese Woche → Später. Leere Gruppen werden
 * nicht zurückgegeben. Erwartet innerhalb jeder Gruppe keine bestimmte Vorsortierung -
 * `entries` behält die Reihenfolge der Eingabe bei.
 */
export function groupOpenPipelineByDate(entries: PipelineEntry[], today: Date = new Date()): OpenPipelineDateGroupBucket[] {
  const buckets = new Map<OpenPipelineDateGroup, PipelineEntry[]>()
  for (const entry of entries) {
    const group = getOpenPipelineDateGroup(entry.date, today)
    const bucket = buckets.get(group)
    if (bucket) bucket.push(entry)
    else buckets.set(group, [entry])
  }
  return OPEN_PIPELINE_DATE_GROUP_ORDER.filter((group) => buckets.has(group)).map((group) => ({
    group,
    label: OPEN_PIPELINE_DATE_GROUP_LABELS[group],
    entries: buckets.get(group) as PipelineEntry[],
  }))
}

function countWeekdaysUpTo(year: number, month: number, throughDay: number): number {
  let count = 0
  for (let day = 1; day <= throughDay; day++) {
    const dayOfWeek = new Date(year, month - 1, day).getDay()
    if (dayOfWeek !== 0 && dayOfWeek !== 6) count++
  }
  return count
}

/**
 * Zählt echte Mo–Fr-Werktage vom 1. des Monats bis `today`, gedeckelt auf `workDays`.
 * Liegt `monthYear` in der Vergangenheit: voller `workDays`-Wert. In der Zukunft: 0.
 */
export function getElapsedWorkDays(monthYear: string, workDays: number, today: Date = new Date()): number {
  const [year, month] = monthYear.split('-').map(Number)
  const todayYear = today.getFullYear()
  const todayMonth = today.getMonth() + 1

  if (todayYear === year && todayMonth === month) {
    return Math.min(workDays, countWeekdaysUpTo(year, month, today.getDate()))
  }
  const isPast = todayYear > year || (todayYear === year && todayMonth > month)
  return isPast ? workDays : 0
}

/**
 * Verbleibende Arbeitstage bis Monatsende, INKLUSIVE heute (im Gegensatz zu
 * `getElapsedWorkDays`, das heute als bereits verstrichen zählt). Auf `workDays` gedeckelt,
 * genau wie `getElapsedWorkDays` - das Arbeitstage-Budget aus den Settings ist die
 * Obergrenze, nicht die echte Kalender-Wochentagszahl. Nur sinnvoll für den echten
 * aktuellen Kalendermonat; Aufrufer prüfen das vorher (siehe `isRealCurrentMonth`).
 */
export function getRemainingWorkDays(monthYear: string, workDays: number, today: Date = new Date()): number {
  const [year, month] = monthYear.split('-').map(Number)
  const elapsedBeforeToday = countWeekdaysUpTo(year, month, today.getDate() - 1)
  return Math.max(0, workDays - Math.min(workDays, elapsedBeforeToday))
}

export interface PaceMetric {
  required: number
  actual: number
  /** actual - required, gerundet: positiv = vor dem Soll, negativ = hinter dem Soll. */
  diff: number
}

export interface PaceStatus {
  isCurrentMonth: boolean
  elapsedWorkDays: number
  totalWorkDays: number
  decisionCalls: PaceMetric
  heldMeetings: PaceMetric
}

/**
 * `monthPipeline` und `monthDailyActivity` müssen bereits auf `monthYear` gefiltert sein
 * (siehe `isInMonth`). `settings` sind die für `monthYear` aufgelösten Settings (siehe
 * `getSettingsForMonth` in lib/defaultData.ts).
 */
export function getPaceStatus(
  funnel: Funnel,
  monthYear: string,
  settings: Settings,
  monthPipeline: PipelineEntry[],
  monthDailyActivity: DailyActivityEntry[],
  today: Date = new Date(),
): PaceStatus {
  const isCurrentMonth = isRealCurrentMonth(monthYear, today)
  const elapsedWorkDays = getElapsedWorkDays(monthYear, settings.workDays, today)
  const ratio = settings.workDays > 0 ? elapsedWorkDays / settings.workDays : 0

  const requiredDecisionCalls = funnel.decisionCalls.perMonth * ratio
  const requiredHeldMeetings = funnel.heldMeetings.perMonth * ratio
  const actualDecisionCalls = monthDailyActivity.reduce((sum, entry) => sum + entry.count, 0)
  const actualHeldMeetings = getHeldMeetingsCount(monthPipeline, todayISODate(today))

  return {
    isCurrentMonth,
    elapsedWorkDays,
    totalWorkDays: settings.workDays,
    decisionCalls: {
      required: requiredDecisionCalls,
      actual: actualDecisionCalls,
      diff: Math.round(actualDecisionCalls - requiredDecisionCalls),
    },
    heldMeetings: {
      required: requiredHeldMeetings,
      actual: actualHeldMeetings,
      diff: Math.round(actualHeldMeetings - requiredHeldMeetings),
    },
  }
}

export interface CatchUpPace {
  isCurrentMonth: boolean
  /** Noch fehlende Entscheider-Gespräche für den Monat (Gesamt-Soll minus bereits erfasste). */
  remainingTarget: number
  remainingWorkDays: number
  remainingWeeks: number
  /** Nötig pro verbleibendem Arbeitstag (inkl. heute), um das Monatsziel noch zu erreichen. */
  perDay: number
  /** Nötig pro verbleibender Woche, um das Monatsziel noch zu erreichen. */
  perWeek: number
}

/**
 * Dynamischer "Aufhol-Wert" statt statischem Monatsdurchschnitt: das Rest-Soll (bezogen auf
 * dieselbe Stretch-Goal-Stufe wie `funnel`) verteilt auf die noch verbleibenden Arbeitstage
 * bzw. Wochen bis Monatsende. Steigt, wenn man hinter dem Soll liegt, sinkt, wenn man voraus
 * ist. `pace` ist der bereits berechnete PaceStatus für dieselbe Stufe (liefert isCurrentMonth
 * und die bisher erfassten Gespräche) - vermeidet doppelte Berechnung derselben Werte.
 * An den letzten Arbeitstagen des Monats (remainingWorkDays = 0) wird das Rest-Soll direkt
 * als perDay/perWeek gezeigt statt durch 0 zu teilen.
 */
export function getCatchUpPace(
  funnel: Funnel,
  monthYear: string,
  settings: Settings,
  pace: PaceStatus,
  today: Date = new Date(),
): CatchUpPace {
  const remainingTarget = Math.max(0, funnel.decisionCalls.perMonth - pace.decisionCalls.actual)
  const remainingWorkDays = pace.isCurrentMonth ? getRemainingWorkDays(monthYear, settings.workDays, today) : 0
  const remainingWeeks = remainingWorkDays / WORK_DAYS_PER_WEEK

  return {
    isCurrentMonth: pace.isCurrentMonth,
    remainingTarget,
    remainingWorkDays,
    remainingWeeks,
    perDay: remainingWorkDays > 0 ? remainingTarget / remainingWorkDays : remainingTarget,
    perWeek: remainingWeeks > 0 ? remainingTarget / remainingWeeks : remainingTarget,
  }
}
