import { Collapsible } from './ui/Collapsible'
import { FunnelBreakdown } from './FunnelBreakdown'
import { SettingsPanel } from './SettingsPanel'
import { StretchGoals } from './StretchGoals'
import type { Funnel, StretchScenario } from '../lib/calculations'
import type { Settings } from '../types'

interface FunnelItem {
  scenario: StretchScenario
  funnel: Funnel
}

interface Props {
  monthYear: string
  settings: Settings
  onChangeMonthYear: (monthYear: string) => void
  onChangeSettings: (settings: Settings) => void
  scenarios: StretchScenario[]
  funnelItems: FunnelItem[]
}

export function MonthSetup({ monthYear, settings, onChangeMonthYear, onChangeSettings, scenarios, funnelItems }: Props) {
  return (
    <Collapsible
      title="Monats-Setup"
      subtitle="Einstellungen & Trichter – nur einmal im Monat relevant"
      defaultOpen={false}
    >
      <div className="app-grid">
        <SettingsPanel monthYear={monthYear} settings={settings} onChangeMonthYear={onChangeMonthYear} onChangeSettings={onChangeSettings} />
        <StretchGoals scenarios={scenarios} />
        <FunnelBreakdown items={funnelItems} />
      </div>
    </Collapsible>
  )
}
