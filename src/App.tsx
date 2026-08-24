import { useMemo } from 'react'
import { DealList } from './components/DealList'
import { FunnelBreakdown } from './components/FunnelBreakdown'
import { HistoryPanel } from './components/HistoryPanel'
import { KpiOverview } from './components/KpiOverview'
import { QuarterYearPanel } from './components/QuarterYearPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { StatusBadge } from './components/StatusBadge'
import { StretchGoals } from './components/StretchGoals'
import {
  getAchievementPct,
  getActualRevenue,
  getCommission,
  getFunnel,
  getGrossTotal,
  getMissingRevenue,
  getQuarterSum,
  getRecordStatus,
  getStretchScenarios,
  getYearSum,
} from './lib/calculations'
import { useDashboardData } from './state/useDashboardData'
import type { Deal, HistoryEntry, Settings } from './types'
import './App.css'

function App() {
  const { data, status, errorMessage, update } = useDashboardData()

  const derived = useMemo(() => {
    if (!data) return null

    const actualRevenue = getActualRevenue(data.currentMonth.deals)
    const commission = getCommission(actualRevenue, data.currentMonth.settings.commissionRate)
    const grossTotal = getGrossTotal(data.currentMonth.settings.baseSalary, commission)
    const achievementPct = getAchievementPct(actualRevenue, data.currentMonth.settings.monthlyTarget)
    const missingRevenue = getMissingRevenue(data.currentMonth.settings.monthlyTarget, actualRevenue)
    const record = getRecordStatus(actualRevenue, data.history)

    const quarterSum = getQuarterSum(
      data.currentMonth.monthYear,
      actualRevenue,
      data.history,
      data.quarterTarget.quarterLabel,
      data.quarterTarget.target,
    )
    const yearSum = getYearSum(
      data.currentMonth.monthYear,
      actualRevenue,
      data.history,
      data.yearTarget.year,
      data.yearTarget.target,
    )

    const scenarios = getStretchScenarios(
      data.currentMonth.settings.monthlyTarget,
      actualRevenue,
      data.currentMonth.settings,
    )
    const funnelItems = scenarios.map((scenario) => ({
      scenario,
      funnel: getFunnel(scenario.requiredRevenue, data.currentMonth.settings),
    }))

    return { actualRevenue, commission, grossTotal, achievementPct, missingRevenue, record, quarterSum, yearSum, scenarios, funnelItems }
  }, [data])

  if (!data || !derived) {
    return (
      <div className="app-shell app-shell-centered">
        <p className="loading-hint">{status === 'error' ? `Fehler: ${errorMessage}` : 'Lädt Dashboard…'}</p>
      </div>
    )
  }

  const updateSettings = (settings: Settings) =>
    update((prev) => ({ ...prev, currentMonth: { ...prev.currentMonth, settings } }))

  const updateMonthYear = (monthYear: string) =>
    update((prev) => ({ ...prev, currentMonth: { ...prev.currentMonth, monthYear } }))

  const updateDeals = (deals: Deal[]) =>
    update((prev) => ({ ...prev, currentMonth: { ...prev.currentMonth, deals } }))

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

      <main className="app-grid">
        <SettingsPanel currentMonth={data.currentMonth} onChangeMonthYear={updateMonthYear} onChangeSettings={updateSettings} />
        <DealList deals={data.currentMonth.deals} onChange={updateDeals} />
        <KpiOverview
          actualRevenue={derived.actualRevenue}
          commission={derived.commission}
          grossTotal={derived.grossTotal}
          achievementPct={derived.achievementPct}
          missingRevenue={derived.missingRevenue}
          record={derived.record}
        />
        <QuarterYearPanel
          quarterTarget={data.quarterTarget}
          yearTarget={data.yearTarget}
          quarterSum={derived.quarterSum}
          yearSum={derived.yearSum}
          onChangeQuarterTarget={updateQuarterTarget}
          onChangeYearTarget={updateYearTarget}
        />
        <HistoryPanel history={data.history} onChange={updateHistory} />
        <StretchGoals scenarios={derived.scenarios} />
        <FunnelBreakdown items={derived.funnelItems} />
      </main>
    </div>
  )
}

export default App
