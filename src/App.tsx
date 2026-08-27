import { useMemo, useState } from 'react'
import { DailyActivityPanel } from './components/DailyActivityPanel'
import { DealList } from './components/DealList'
import { MonthSetup } from './components/MonthSetup'
import { MonthSwitcher } from './components/MonthSwitcher'
import { PaceStatus } from './components/PaceStatus'
import { PipelinePanel } from './components/PipelinePanel'
import { ProgressOverview } from './components/ProgressOverview'
import { QuarterYearHistorySetup } from './components/QuarterYearHistorySetup'
import { StatusBadge } from './components/StatusBadge'
import {
  getAchievementPct,
  getBookingCatchUpPace,
  getCatchUpPace,
  getCommission,
  getCommissionTier,
  getFunnel,
  getGrossTotal,
  getMissingRevenue,
  getMonthlyRevenueMap,
  getNextCommissionTierProgress,
  getPaceStatus,
  getQuarterSum,
  getRecordStatus,
  getStretchScenarios,
  getYearSum,
  isInMonth,
  isRealCurrentMonth,
  todayISODate,
} from './lib/calculations'
import { getSettingsForMonth } from './lib/defaultData'
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
    const settings = getSettingsForMonth(data.settingsByMonth, monthYear)
    const monthDeals = data.deals.filter((deal) => isInMonth(deal.date, monthYear))
    const monthPipeline = data.pipeline.filter((entry) => isInMonth(entry.date, monthYear))
    const monthDailyActivity = data.dailyActivity.filter((entry) => isInMonth(entry.date, monthYear))

    const monthlyRevenueMap = getMonthlyRevenueMap(data.deals, data.history)
    const actualRevenue = monthlyRevenueMap.get(monthYear) ?? 0

    const achievementPct = getAchievementPct(actualRevenue, settings.monthlyTarget)
    const commissionTier = getCommissionTier(achievementPct)
    const commission = getCommission(actualRevenue, commissionTier.rate)
    const grossTotal = getGrossTotal(settings.baseSalary, commission)
    const nextTierProgress = getNextCommissionTierProgress(actualRevenue, settings.monthlyTarget)
    const missingRevenue = getMissingRevenue(settings.monthlyTarget, actualRevenue)
    const record = getRecordStatus(monthlyRevenueMap, monthYear)

    const quarterSum = getQuarterSum(monthlyRevenueMap, data.quarterTarget.quarterLabel, data.quarterTarget.target)
    const yearSum = getYearSum(monthlyRevenueMap, data.yearTarget.year, data.yearTarget.target)

    const scenarios = getStretchScenarios(settings.monthlyTarget, actualRevenue, settings)
    const funnelItems = scenarios.map((scenario) => ({
      scenario,
      funnel: getFunnel(scenario.requiredRevenue, settings),
    }))

    const paceScenario = scenarios.find((scenario) => scenario.level === paceLevel) ?? scenarios[0]
    const paceFunnel = getFunnel(paceScenario.requiredRevenue, settings)
    const pace = getPaceStatus(paceFunnel, monthYear, settings, monthPipeline, monthDailyActivity)
    const catchUpPace = getCatchUpPace(paceFunnel, monthYear, settings, pace)
    const bookingCatchUpPace = getBookingCatchUpPace(paceFunnel, monthYear, settings, pace, monthPipeline)

    const isViewingOtherMonth = !isRealCurrentMonth(monthYear)

    return {
      monthYear,
      settings,
      monthDeals,
      monthPipeline,
      monthDailyActivity,
      actualRevenue,
      commission,
      commissionTier,
      nextTierProgress,
      grossTotal,
      achievementPct,
      missingRevenue,
      record,
      quarterSum,
      yearSum,
      scenarios,
      funnelItems,
      pace,
      catchUpPace,
      bookingCatchUpPace,
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

  // Schreibt Änderungen immer unter den Key des aktuell gewählten Monats – ererbte Werte
  // vom Vormonat (siehe getSettingsForMonth) werden dadurch bei der ersten Änderung zu
  // einem eigenen, ab dann unabhängigen Eintrag für diesen Monat.
  const updateSettings = (settings: Settings) =>
    update((prev) => ({
      ...prev,
      settingsByMonth: { ...prev.settingsByMonth, [prev.selectedMonth.monthYear]: settings },
    }))

  const updateMonthYear = (monthYear: string) => update((prev) => ({ ...prev, selectedMonth: { monthYear } }))

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

  // Übernahme des Umsatzes eines Pipeline-Eintrags in die Deal-Liste: neuer Deal
  // (Firma/Datum vom Termin) + Eintrag wird als abgeschlossener Closed Deal markiert, in
  // einem Update. Kein dauerhafter Link zwischen Deal und Pipeline-Eintrag danach. Wird von
  // zwei Stellen aufgerufen: dem "✓ Deal abschließen"-Button in der Offen-Tabelle (Eintrag
  // ist noch Discovery/Follow-Up, `label: 'Closed Deal'` ist hier die entscheidende
  // Ergänzung) und dem bestehenden "✓ Übernehmen" in der Abgeschlossen-Tabelle (Eintrag ist
  // dort schon 'Closed Deal', die Label-Zuweisung ist für diesen Weg ein No-Op).
  const closeDealFromPipelineEntry = (entry: PipelineEntry, revenue: number) =>
    update((prev) => ({
      ...prev,
      deals: [...prev.deals, { id: newId(), company: entry.company ?? '', revenue, date: entry.date }],
      pipeline: prev.pipeline.map((p) => (p.id === entry.id ? { ...p, label: 'Closed Deal', dealCreated: true } : p)),
    }))

  // Erneuter Kontaktversuch bei einem alten Lost-Lead ("→ Neuer Termin"): neuer,
  // unabhängiger Discovery-Call-Eintrag + der alte Lost-Eintrag wird als "staleLeadHandled"
  // markiert (Label/Datum bleiben unverändert), in einem Update. Arbeitet bewusst auf der
  // VOLLEN prev.pipeline statt über die monatsgefilterte onChange-Prop, da der alte Lost-
  // Eintrag i.d.R. in einem anderen Monat liegt als dem gerade angezeigten und über die
  // gefilterte Teilmenge nicht zuverlässig gefunden/markiert werden könnte.
  const reachOutToLostLead = (entry: PipelineEntry, date: string) =>
    update((prev) => ({
      ...prev,
      pipeline: [
        ...prev.pipeline.map((p) => (p.id === entry.id ? { ...p, staleLeadHandled: true } : p)),
        { id: newId(), date, label: 'Discovery Call', company: entry.company ?? '' },
      ],
    }))

  // "Weiterhin Lost": Lead soll nicht mehr im Reminder auftauchen, ohne dass ein neuer
  // Termin angelegt wird - nur das staleLeadHandled-Flag wird gesetzt, sonst bleibt der
  // Eintrag unverändert. Gleicher Grund wie bei reachOutToLostLead für die volle
  // prev.pipeline statt der monatsgefilterten onChange-Prop.
  const dismissStaleLead = (entry: PipelineEntry) =>
    update((prev) => ({
      ...prev,
      pipeline: prev.pipeline.map((p) => (p.id === entry.id ? { ...p, staleLeadHandled: true } : p)),
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

      <MonthSwitcher monthYear={derived.monthYear} onChangeMonthYear={updateMonthYear} />

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
          monthTarget={derived.settings.monthlyTarget}
          quarterLabel={data.quarterTarget.quarterLabel}
          quarterActual={derived.quarterSum.sum}
          quarterTarget={data.quarterTarget.target}
          yearLabel={data.yearTarget.year}
          yearActual={derived.yearSum.sum}
          yearTarget={data.yearTarget.target}
          commission={derived.commission}
          grossTotal={derived.grossTotal}
          commissionTier={derived.commissionTier}
          nextTierProgress={derived.nextTierProgress}
          record={derived.record}
        />

        <DailyActivityPanel
          entries={derived.monthDailyActivity}
          onChange={updateDailyActivity}
          catchUpPace={derived.catchUpPace}
          bookingCatchUpPace={derived.bookingCatchUpPace}
          paceLevel={paceLevel}
        />
        <PaceStatus level={paceLevel} onChangeLevel={setPaceLevel} pace={derived.pace} />

        <PipelinePanel
          pipeline={derived.monthPipeline}
          allMonthsPipeline={data.pipeline}
          monthYear={derived.monthYear}
          onChange={updatePipeline}
          onCreateDeal={closeDealFromPipelineEntry}
          onReachOutToLostLead={reachOutToLostLead}
          onDismissStaleLead={dismissStaleLead}
        />
        <DealList deals={derived.monthDeals} onChange={updateDeals} />
      </main>

      <MonthSetup
        monthYear={derived.monthYear}
        settings={derived.settings}
        onChangeMonthYear={updateMonthYear}
        onChangeSettings={updateSettings}
        scenarios={derived.scenarios}
        funnelItems={derived.funnelItems}
      />

      <QuarterYearHistorySetup
        quarterTarget={data.quarterTarget}
        yearTarget={data.yearTarget}
        onChangeQuarterTarget={updateQuarterTarget}
        onChangeYearTarget={updateYearTarget}
        history={data.history}
        onChangeHistory={updateHistory}
      />
    </div>
  )
}

export default App
