import { Card } from './ui/Card'
import { formatCurrency } from '../lib/format'
import type { StretchScenario } from '../lib/calculations'

export function StretchGoals({ scenarios }: { scenarios: StretchScenario[] }) {
  return (
    <Card title="Stretch-Goal-Szenarien" subtitle="Nötiger Umsatz je Zielstufe" className="span-2">
      <div className="scenario-grid">
        {scenarios.map((scenario) => (
          <div className="scenario-card" key={scenario.level}>
            <h3>{scenario.label}</h3>
            <dl>
              <div>
                <dt>Nötiger Umsatz</dt>
                <dd>{formatCurrency(scenario.requiredRevenue)}</dd>
              </div>
              <div>
                <dt>Noch offen</dt>
                <dd>{formatCurrency(scenario.openAmount)}</dd>
              </div>
              <div>
                <dt>Provision</dt>
                <dd>{formatCurrency(scenario.commission)}</dd>
              </div>
              <div>
                <dt>Brutto gesamt</dt>
                <dd>{formatCurrency(scenario.grossTotal)}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </Card>
  )
}
