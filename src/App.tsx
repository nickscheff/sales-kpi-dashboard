import { useMemo, useState } from 'react'
import { DailyActivityPanel } from './components/DailyActivityPanel'
import { DealList } from './components/DealList'
import { MonthSetup } from './components/MonthSetup'
import { PaceStatus } from './components/PaceStatus'
import { PipelinePanel } from './components/PipelinePanel'
import { ProgressOverview } from './components/ProgressOverview'
import { StatusBadge } from './components/StatusBadge'
import {
  getAchievementPct,
  getCommission,
  getCommissionTier,
  getFunnel,
  getGrossTotal,
  getMissingRevenue,
  getMonthlyRevenueMap,
  getPaceStatus,
  getQuarterSum,
  getRecordStatus,
  getStretchScenarios,
  getYearSum,
  isInMonth,
  isRealCurrentMonth,
  todayISODate,
} from './lib/calculations'
import { newId } from './lib/id'
import { useDashboardData } from './state/useDashboardData'
import type { DailyActivityEntry, Deal, HistoryEntry, PipelineEntry, Settings } from './types'
import './App.css'

function App() {
  const { data, status, errorMessage, update } = useDashboardData()
  const [paceLevel, setPaceLevel] = useState(1)

  const derived = useMemo(() => {
    if (!data) return null

    const monthYear = data.selectedMonth.monthYear
    const monthDeals = data.deals.filter((deal) => isInMonth(deal.date, monthYear))
    const monthPipeline = data.pipeline.filter((entry) => isInMonth(entry.date, monthYear))
    const monthDailyActivity = data.dailyActivity.filter((entry) => isInMonth(entry.date, monthYear))

    const monthlyRevenueMap = getMonthlyRevenueMap(data.deals, data.history)
    const actualRevenue = monthlyRevenueMap.get(monthYear) ?? 0

    const achievementPct = getAchievementPct(actualRevenue, data.selectedMonth.settings.monthlyTarget)
    const commissionTier = getCommissionTier(achievementPct)
    const commission = getCommission(actualRevenue, commissionTier.rate)
    const grossTotal = getGrossTotal(data.selectedMonth.settings.baseSalary, commission)
    const missingRevenue = getMissingRevenue(data.selectedMonth.settings.monthlyTarget, actualRevenue)
    const record = getRecordStatus(monthlyRevenueMap, monthYear)

    const quarterSum = getQuarterSum(monthlyRevenueMap, data.quarterTarget.quarterLabel, data.quarterTarget.target)
    const yearSum = getYearSum(monthlyRevenueMap, data.yearTarget.year, data.yearTarget.target)

    const scenarios = getStretchScenarios(
      data.selectedMonth.settings.monthlyTarget,
      actualRevenue,
      data.selectedMonth.settings,
    )
    const funnelItems = scenarios.map((scenario) => ({
      scenario,
      funnel: getFunnel(scenario.requiredRevenue, data.selectedMonth.settings),
    }))

    const paceScenario = scenarios.find((scenario) => scenario.level === paceLevel) ?? scenarios[0]
    const paceFunnel = getFunnel(paceScenario.requiredRevenue, data.selectedMonth.settings)
    const pace = getPaceStatus(paceFunnel, data.selectedMonth, monthPipeline, monthDailyActivity)

    const isViewingOtherMonth = !isRealCurrentMonth(monthYear)

    return {
      monthYear,
      monthDeals,
      monthPipeline,
      monthDailyActivity,
      actualRevenue,
      commission,
      commissionTier,
      grossTotal,
      achievementPct,
      missingRevenue,
      record,
      quarterSum,
      yearSum,
      scenarios,
      funnelItems,
      pace,
      isViewingOtherMonth,
    }
  }, [data, paceLevel])

  if (!data || !derived) {
    return (
      <div className="app-shell app-shell-centered">
        <p className="loading-hint">{status === 'error' ? `Fehler: ${errorMessage}` : 'Lädt Dashboard…'}</p>
      </div>
    )
  }

  const updateSettings = (settings: Settings) =>
    update((prev) => ({ ...prev, selectedMonth: { ...prev.selectedMonth, settings } }))

  const updateMonthYear = (monthYear: string) =>
    update((prev) => ({ ...prev, selectedMonth: { ...prev.selectedMonth, monthYear } }))

  // Alle drei Listen sind durchgehend gespeichert; die Komponenten bekommen nur die auf
  // den gewählten Monat gefilterte Teilmenge und liefern diese bearbeitet zurück – hier
  // wird sie mit den unveränderten Einträgen der übrigen Monate wieder zusammengeführt.
  // Ändert der Nutzer ein Datum auf einen anderen Monat, verschwindet der Eintrag dadurch
  // automatisch aus der aktuellen Ansicht und taucht beim neuen Monat auf.
  const updateDeals = (monthDeals: Deal[]) =>
    update((prev) => ({
      ...prev,
      deals: [...prev.deals.filter((deal) => !isInMonth(deal.date, prev.selectedMonth.monthYear)), ...monthDeals],
    }))

  const updatePipeline = (monthPipeline: PipelineEntry[]) =>
    update((prev) => ({
      ...prev,
      pipeline: [
        ...prev.pipeline.filter((entry) => !isInMonth(entry.date, prev.selectedMonth.monthYear)),
        ...monthPipeline,
      ],
    }))

  // Einmalige Übernahme des Umsatzes eines "Closed Deal"-Pipeline-Eintrags in die
  // Deal-Liste: neuer Deal (Firma/Datum vom Termin) + Flag am Pipeline-Eintrag in einem
  // Update, kein dauerhafter Link zwischen Deal und Pipeline-Eintrag danach.
  const createDealFromPipelineEntry = (entry: PipelineEntry, revenue: number) =>
    update((prev) => ({
      ...prev,
      deals: [...prev.deals, { id: newId(), company: entry.company ?? '', revenue, date: entry.date }],
      pipeline: prev.pipeline.map((p) => (p.id === entry.id ? { ...p, dealCreated: true } : p)),
    }))

  const updateDailyActivity = (monthDailyActivity: DailyActivityEntry[]) =>
    update((prev) => ({
      ...prev,
      dailyActivity: [
        ...prev.dailyActivity.filter((entry) => !isInMonth(entry.date, prev.selectedMonth.monthYear)),
        ...monthDailyActivity,
      ],
    }))

  const updateHistory = (history: HistoryEntry[]) => update((prev) => ({ ...prev, history }))

  const updateQuarterTarget = (target: number) =>
    update((prev) => ({ ...prev, quarterTarget: { ...prev.quarterTarget, target } }))

  const updateYearTarget = (target: number) =>
    update((prev) => ({ ...prev, yearTarget: { ...prev.yearTarget, target } }))

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <h1>Sales-KPI-Dashboard</h1>
          <p className="app-subtitle">Zielplanung rückwärts gerechnet – bis zum nötigen Entscheider-Gespräch.</p>
        </div>
        <StatusBadge status={status} />
      </header>

      {status === 'error' && errorMessage && <p className="error-banner">{errorMessage}</p>}

      {derived.isViewingOtherMonth && (
        <p className="month-hint">
          Du betrachtest {derived.monthYear}, nicht den aktuellen Kalendermonat. Neue Einträge (Deal, Termin,
          Tagesaktivität) werden trotzdem mit dem heutigen Datum ({todayISODate()}) angelegt und erscheinen deshalb
          im echten aktuellen Monat – nicht unbedingt hier in dieser Ansicht.
        </p>
      )}

      <main className="app-grid">
        <ProgressOverview
          monthActual={derived.actualRevenue}
          monthTarget={data.selectedMonth.settings.monthlyTarget}
          quarterLabel={data.quarterTarget.quarterLabel}
          quarterActual={derived.quarterSum.sum}
          quarterTarget={data.quarterTarget.target}
          yearLabel={data.yearTarget.year}
          yearActual={derived.yearSum.sum}
          yearTarget={data.yearTarget.target}
          commission={derived.commission}
          grossTotal={derived.grossTotal}
          commissionTier={derived.commissionTier}
          record={derived.record}
        />

        <DailyActivityPanel entries={derived.monthDailyActivity} onChange={updateDailyActivity} />
        <PaceStatus level={paceLevel} onChangeLevel={setPaceLevel} pace={derived.pace} />

        <PipelinePanel
          pipeline={derived.monthPipeline}
          onChange={updatePipeline}
          onCreateDeal={createDealFromPipelineEntry}
        />
        <DealList deals={derived.monthDeals} onChange={updateDeals} />
      </main>

      <MonthSetup
        selectedMonth={data.selectedMonth}
        onChangeMonthYear={updateMonthYear}
        onChangeSettings={updateSettings}
        quarterTarget={data.quarterTarget}
        yearTarget={data.yearTarget}
        onChangeQuarterTarget={updateQuarterTarget}
        onChangeYearTarget={updateYearTarget}
        history={data.history}
        onChangeHistory={updateHistory}
        scenarios={derived.scenarios}
        funnelItems={derived.funnelItems}
      />
    </div>
  )
}

export default App
