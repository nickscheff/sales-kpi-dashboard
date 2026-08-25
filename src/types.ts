/** Einstellungen für den gewählten Monat. Alle *Rate-Felder sind Prozentwerte (z.B. 8 = 8%). */
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
  /** Format "YYYY-MM-DD" – bestimmt, welchem Monat der Deal zugerechnet wird. */
  date: string
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

/**
 * 'Discovery Call' / 'Follow-Up Call': Termin fand statt, Ausgang noch offen.
 * 'No-Show/Cancel': Termin hat NICHT stattgefunden.
 * 'Lost': Termin fand statt, aber kein Abschluss.
 * 'Closed Deal': Termin fand statt und führte zum Abschluss (Umsatz wird weiterhin
 * separat in der Deal-Liste erfasst, keine automatische Verknüpfung).
 */
export type PipelineLabel = 'Discovery Call' | 'Follow-Up Call' | 'No-Show/Cancel' | 'Lost' | 'Closed Deal'

export interface PipelineEntry {
  id: string
  /** Format "YYYY-MM-DD" – bestimmt, welchem Monat der Termin zugerechnet wird. */
  date: string
  label: PipelineLabel
  company?: string
}

export interface DailyActivityEntry {
  id: string
  /** Format "YYYY-MM-DD" */
  date: string
  count: number
}

/** Nur noch Filter/Konfiguration für den gerade betrachteten Monat, kein Datenblock mehr. */
export interface SelectedMonth {
  /** Format "YYYY-MM" */
  monthYear: string
  settings: Settings
}

export interface DashboardData {
  selectedMonth: SelectedMonth
  /** Durchgehend über alle Monate, nach `date` gefiltert für die jeweilige Monats-Ansicht. */
  deals: Deal[]
  pipeline: PipelineEntry[]
  dailyActivity: DailyActivityEntry[]
  quarterTarget: QuarterTarget
  yearTarget: YearTarget
  history: HistoryEntry[]
}
