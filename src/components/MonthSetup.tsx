import { Collapsible } from './ui/Collapsible'
import { FunnelBreakdown } from './FunnelBreakdown'
import { HistoryPanel } from './HistoryPanel'
import { QuarterYearTargets } from './QuarterYearTargets'
import { SettingsPanel } from './SettingsPanel'
import { StretchGoals } from './StretchGoals'
import type { Funnel, StretchScenario } from '../lib/calculations'
import type { HistoryEntry, QuarterTarget, Settings, YearTarget } from '../types'

interface FunnelItem {
  scenario: StretchScenario
  funnel: Funnel
}

interface Props {
  monthYear: string
  settings: Settings
  onChangeMonthYear: (monthYear: string) => void
  onChangeSettings: (settings: Settings) => void
  quarterTarget: QuarterTarget
  yearTarget: YearTarget
  onChangeQuarterTarget: (target: number) => void
  onChangeYearTarget: (target: number) => void
  history: HistoryEntry[]
  onChangeHistory: (history: HistoryEntry[]) => void
  scenarios: StretchScenario[]
  funnelItems: FunnelItem[]
}

export function MonthSetup({
  monthYear,
  settings,
  onChangeMonthYear,
  onChangeSettings,
  quarterTarget,
  yearTarget,
  onChangeQuarterTarget,
  onChangeYearTarget,
  history,
  onChangeHistory,
  scenarios,
  funnelItems,
}: Props) {
  return (
    <Collapsible
      title="Monats-Setup"
      subtitle="Einstellungen, Ziele & Trichter – nur einmal im Monat relevant"
      defaultOpen={false}
    >
      <div className="app-grid">
        <SettingsPanel monthYear={monthYear} settings={settings} onChangeMonthYear={onChangeMonthYear} onChangeSettings={onChangeSettings} />
        <QuarterYearTargets
          quarterTarget={quarterTarget}
          yearTarget={yearTarget}
          onChangeQuarterTarget={onChangeQuarterTarget}
          onChangeYearTarget={onChangeYearTarget}
        />
        <HistoryPanel history={history} onChange={onChangeHistory} />
        <StretchGoals scenarios={scenarios} />
        <FunnelBreakdown items={funnelItems} />
      </div>
    </Collapsible>
  )
}
