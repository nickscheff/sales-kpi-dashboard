import { Card } from './ui/Card'
import { PillButton } from './ui/PillButton'
import { formatCurrency } from '../lib/format'
import type { Deal } from '../types'

interface Props {
  deals: Deal[]
  onChange: (deals: Deal[]) => void
}

function newId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`
}

export function DealList({ deals, onChange }: Props) {
  const total = deals.reduce((sum, deal) => sum + deal.revenue, 0)

  const updateDeal = (id: string, patch: Partial<Deal>) =>
    onChange(deals.map((deal) => (deal.id === id ? { ...deal, ...patch } : deal)))

  const removeDeal = (id: string) => onChange(deals.filter((deal) => deal.id !== id))

  const addDeal = () => onChange([...deals, { id: newId(), company: '', revenue: 0 }])

  return (
    <Card title="Deal-Liste" subtitle="Ist-Umsatz = Summe aller Deals" className="span-2">
      <table className="table">
        <thead>
          <tr>
            <th>Firma</th>
            <th>Umsatz</th>
            <th aria-hidden="true"></th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr key={deal.id}>
              <td>
                <input
                  type="text"
                  value={deal.company}
                  placeholder="Firma"
                  onChange={(e) => updateDeal(deal.id, { company: e.target.value })}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={deal.revenue}
                  min={0}
                  step={100}
                  onChange={(e) => updateDeal(deal.id, { revenue: e.target.valueAsNumber || 0 })}
                />
              </td>
              <td>
                <PillButton
                  variant="ghost"
                  type="button"
                  onClick={() => removeDeal(deal.id)}
                  aria-label={`${deal.company || 'Deal'} entfernen`}
                >
                  ✕
                </PillButton>
              </td>
            </tr>
          ))}
          {deals.length === 0 && (
            <tr>
              <td colSpan={3} className="table-empty">Noch keine Deals erfasst.</td>
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr>
            <td>Ist-Umsatz</td>
            <td colSpan={2}>{formatCurrency(total)}</td>
          </tr>
        </tfoot>
      </table>
      <PillButton type="button" onClick={addDeal}>+ Deal hinzufügen</PillButton>
    </Card>
  )
}
