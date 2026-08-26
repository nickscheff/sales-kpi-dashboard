import { Collapsible } from './ui/Collapsible'
import { HistoryPanel } from './HistoryPanel'
import { QuarterYearTargets } from './QuarterYearTargets'
import type { HistoryEntry, QuarterTarget, YearTarget } from '../types'

interface Props {
  quarterTarget: QuarterTarget
  yearTarget: YearTarget
  onChangeQuarterTarget: (target: number) => void
  onChangeYearTarget: (target: number) => void
  history: HistoryEntry[]
  onChangeHistory: (history: HistoryEntry[]) => void
}

export function QuarterYearHistorySetup({
  quarterTarget,
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
          quarterTarget={quarterTarget}
          yearTarget={yearTarget}
          onChangeQuarterTarget={onChangeQuarterTarget}
          onChangeYearTarget={onChangeYearTarget}
        />
        <HistoryPanel history={history} onChange={onChangeHistory} />
      </div>
    </Collapsible>
  )
}
