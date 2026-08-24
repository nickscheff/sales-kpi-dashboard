import { Card } from './ui/Card'
import { formatNumber } from '../lib/format'
import type { Funnel, StretchScenario } from '../lib/calculations'

interface ScenarioFunnel {
  scenario: StretchScenario
  funnel: Funnel
}

export function FunnelBreakdown({ items }: { items: ScenarioFunnel[] }) {
  return (
    <Card
      title="Trichter-Rückwärtsrechnung"
      subtitle="Pro Woche = Arbeitstage ÷ 5 (Annahme 5-Tage-Woche), pro Tag = Arbeitstage"
      className="span-2"
    >
      <div className="funnel-scenarios">
        {items.map(({ scenario, funnel }) => (
          <div className="funnel-block" key={scenario.level}>
            <h3>{scenario.label}</h3>
            <div className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Stufe</th>
                    <th>Pro Monat</th>
                    <th>Pro Woche</th>
                    <th>Pro Arbeitstag</th>
                  </tr>
                </thead>
                <tbody>
                  {funnel.stages.map((stage) => (
                    <tr key={stage.label}>
                      <td>{stage.label}</td>
                      <td>{formatNumber(stage.perMonth)}</td>
                      <td>{formatNumber(stage.perWeek)}</td>
                      <td>{formatNumber(stage.perDay)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
