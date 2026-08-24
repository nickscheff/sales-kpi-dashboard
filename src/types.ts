/** Einstellungen für den aktuellen Monat. Alle *Rate-Felder sind Prozentwerte (z.B. 8 = 8%). */
export interface Settings {
  monthlyTarget: number
  baseSalary: number
  ticketSize: number
  closingRate: number
  noShowRate: number
  /** Terminierungsquote: Anteil der Entscheider-Gespräche, die zu einem gebuchten Termin führen. */
  bookingRate: number
  workDays: number
}

export interface Deal {
  id: string
  company: string
  revenue: number
}

export interface HistoryEntry {
  id: string
  /** Format "YYYY-MM" */
  monthYear: string
  target: number
  achieved: number
}

export interface QuarterTarget {
  /** Format "YYYY-Qn" */
  quarterLabel: string
  target: number
}

export interface YearTarget {
  year: number
  target: number
}

export interface CurrentMonth {
  /** Format "YYYY-MM" */
  monthYear: string
  settings: Settings
  deals: Deal[]
}

export interface DashboardData {
  currentMonth: CurrentMonth
  quarterTarget: QuarterTarget
  yearTarget: YearTarget
  history: HistoryEntry[]
}
