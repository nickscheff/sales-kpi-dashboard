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
  getActualRevenue,
  getCommission,
  getCommissionTier,
  getFunnel,
  getGrossTotal,
  getMissingRevenue,
  getPaceStatus,
  getQuarterSum,
  getRecordStatus,
  getStretchScenarios,
  getYearSum,
} from './lib/calculations'
import { useDashboardData } from './state/useDashboardData'
import type { Deal, HistoryEntry, PipelineEntry, Settings } from './types'
import './App.css'

function App() {
  const { data, status, errorMessage, update } = useDashboardData()
  const [paceLevel, setPaceLevel] = useState(1)

  const derived = useMemo(() => {
    if (!data) return null

    const actualRevenue = getActualRevenue(data.currentMonth.deals)
    const achievementPct = getAchievementPct(actualRevenue, data.currentMonth.settings.monthlyTarget)
    const commissionTier = getCommissionTier(achievementPct)
    const commission = getCommission(actualRevenue, commissionTier.rate)
    const grossTotal = getGrossTotal(data.currentMonth.settings.baseSalary, commission)
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

    const paceScenario = scenarios.find((scenario) => scenario.level === paceLevel) ?? scenarios[0]
    const paceFunnel = getFunnel(paceScenario.requiredRevenue, data.currentMonth.settings)
    const pace = getPaceStatus(paceFunnel, data.currentMonth)

    return {
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
    update((prev) => ({ ...prev, currentMonth: { ...prev.currentMonth, settings } }))

  const updateMonthYear = (monthYear: string) =>
    update((prev) => ({ ...prev, currentMonth: { ...prev.currentMonth, monthYear } }))

  const updateDeals = (deals: Deal[]) =>
    update((prev) => ({ ...prev, currentMonth: { ...prev.currentMonth, deals } }))

  const updatePipeline = (pipeline: PipelineEntry[]) =>
    update((prev) => ({ ...prev, currentMonth: { ...prev.currentMonth, pipeline } }))

  const updateDecisionCallsMade = (decisionCallsMade: number) =>
    update((prev) => ({ ...prev, currentMonth: { ...prev.currentMonth, decisionCallsMade } }))

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
        <ProgressOverview
          monthActual={derived.actualRevenue}
          monthTarget={data.currentMonth.settings.monthlyTarget}
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

        <DailyActivityPanel decisionCallsMade={data.currentMonth.decisionCallsMade} onChange={updateDecisionCallsMade} />
        <PaceStatus level={paceLevel} onChangeLevel={setPaceLevel} pace={derived.pace} />

        <PipelinePanel pipeline={data.currentMonth.pipeline} onChange={updatePipeline} />
        <DealList deals={data.currentMonth.deals} onChange={updateDeals} />
      </main>

      <MonthSetup
        currentMonth={data.currentMonth}
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
