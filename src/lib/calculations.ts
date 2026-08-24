import type { Deal, HistoryEntry, Settings } from '../types'

/** 1. Provision & Brutto */

export function getActualRevenue(deals: Deal[]): number {
  return deals.reduce((sum, deal) => sum + deal.revenue, 0)
}

export function getCommission(revenue: number, commissionRatePct: number): number {
  return revenue * (commissionRatePct / 100)
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

/** 3. Quartals-/Jahresumsatz */

export function monthYearToQuarterLabel(monthYear: string): string {
  const [year, month] = monthYear.split('-').map(Number)
  const quarter = Math.ceil(month / 3)
  return `${year}-Q${quarter}`
}

export function monthYearToYear(monthYear: string): number {
  return Number(monthYear.split('-')[0])
}

export interface PeriodSum {
  sum: number
  shortfall: number
}

export function getQuarterSum(
  currentMonthYear: string,
  currentMonthRevenue: number,
  history: HistoryEntry[],
  quarterLabel: string,
  quarterTarget: number,
): PeriodSum {
  let sum = 0
  if (monthYearToQuarterLabel(currentMonthYear) === quarterLabel) {
    sum += currentMonthRevenue
  }
  for (const entry of history) {
    if (monthYearToQuarterLabel(entry.monthYear) === quarterLabel) {
      sum += entry.achieved
    }
  }
  return { sum, shortfall: Math.max(0, quarterTarget - sum) }
}

export function getYearSum(
  currentMonthYear: string,
  currentMonthRevenue: number,
  history: HistoryEntry[],
  year: number,
  yearTarget: number,
): PeriodSum {
  let sum = 0
  if (monthYearToYear(currentMonthYear) === year) {
    sum += currentMonthRevenue
  }
  for (const entry of history) {
    if (monthYearToYear(entry.monthYear) === year) {
      sum += entry.achieved
    }
  }
  return { sum, shortfall: Math.max(0, yearTarget - sum) }
}

/** 4. Rekord-Tracking */

export interface RecordStatus {
  isRecord: boolean
  recordValue: number | null
  diffToRecord: number
}

export function getRecordStatus(actual: number, history: HistoryEntry[]): RecordStatus {
  if (history.length === 0) {
    return { isRecord: actual > 0, recordValue: null, diffToRecord: 0 }
  }
  const recordValue = Math.max(...history.map((entry) => entry.achieved))
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
    const commission = getCommission(requiredRevenue, settings.commissionRate)
    return {
      level,
      label: level === 1 ? 'Basisziel (100%)' : `${Math.round(level * 100)}%`,
      requiredRevenue,
      openAmount: Math.max(0, requiredRevenue - actualRevenue),
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
  stages: FunnelStage[]
}

export function getFunnel(targetRevenue: number, settings: Settings): Funnel {
  const deals = settings.ticketSize > 0 ? targetRevenue / settings.ticketSize : 0
  const heldMeetings = settings.closingRate > 0 ? deals / (settings.closingRate / 100) : 0
  const noShowFactor = 1 - settings.noShowRate / 100
  const bookedMeetings = noShowFactor > 0 ? heldMeetings / noShowFactor : 0
  const decisionCalls = settings.bookingRate > 0 ? bookedMeetings / (settings.bookingRate / 100) : 0

  const weeksPerMonth = settings.workDays > 0 ? settings.workDays / WORK_DAYS_PER_WEEK : 0

  const toStage = (label: string, perMonth: number): FunnelStage => ({
    label,
    perMonth,
    perWeek: weeksPerMonth > 0 ? perMonth / weeksPerMonth : 0,
    perDay: settings.workDays > 0 ? perMonth / settings.workDays : 0,
  })

  return {
    targetRevenue,
    stages: [
      toStage('Nötige Deals', deals),
      toStage('Nötige durchgeführte Termine', heldMeetings),
      toStage('Nötige gebuchte Termine', bookedMeetings),
      toStage('Nötige Entscheider-Gespräche', decisionCalls),
    ],
  }
}
