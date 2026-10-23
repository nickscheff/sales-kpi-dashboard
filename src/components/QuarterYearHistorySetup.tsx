import { Collapsible } from './ui/Collapsible'
import { HistoryPanel } from './HistoryPanel'
import { QuarterYearTargets } from './QuarterYearTargets'
import type { HistoryEntry } from '../types'

interface Props {
  quarterLabel: string
  quarterTarget: number
  year: number
  yearTarget: number
  onChangeQuarterTarget: (target: number) => void
  onChangeYearTarget: (target: number) => void
  history: HistoryEntry[]
  onChangeHistory: (history: HistoryEntry[]) => void
}

export function QuarterYearHistorySetup({
  quarterLabel,
  quarterTarget,
  year,
  yearTarget,
  onChangeQuarterTarget,
  onChangeYearTarget,
  history,
  onChangeHistory,
}: Props) {
  return (
    <Collapsible
      title="Quartals-/Jahresziel & Historie"
      subtitle="Selten benötigt – Ziele werden nur gelegentlich neu gesetzt, Historie nur für Altmonate"
      defaultOpen={false}
    >
      <div className="app-grid">
        <QuarterYearTargets
          quarterLabel={quarterLabel}
          quarterTarget={quarterTarget}
          year={year}
          yearTarget={yearTarget}
          onChangeQuarterTarget={onChangeQuarterTarget}
          onChangeYearTarget={onChangeYearTarget}
        />
        <HistoryPanel history={history} onChange={onChangeHistory} />
      </div>
    </Collapsible>
  )
}
