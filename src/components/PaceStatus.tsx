import { Card } from './ui/Card'
import { PillButton } from './ui/PillButton'
import { formatNumber } from '../lib/format'
import { STRETCH_LEVELS } from '../lib/calculations'
import type { PaceStatus as PaceStatusData } from '../lib/calculations'

interface Props {
  level: number
  onChangeLevel: (level: number) => void
  pace: PaceStatusData
}

function diffLabel(diff: number): string {
  if (diff === 0) return 'Im Soll'
  if (diff > 0) return `${diff} vor dem Soll`
  return `${Math.abs(diff)} hinter dem Soll`
}

function diffClass(diff: number): string {
  if (diff === 0) return ' pace-onplan'
  return diff > 0 ? ' pace-ahead' : ' pace-behind'
}

export function PaceStatus({ level, onChangeLevel, pace }: Props) {
  return (
    <Card title="Soll-Tempo" subtitle="Bin ich heute im Plan?">
      <div className="pace-level-picker">
        {STRETCH_LEVELS.map((l) => (
          <PillButton
            key={l}
            type="button"
            variant={l === level ? 'primary' : 'ghost'}
            onClick={() => onChangeLevel(l)}
          >
            {Math.round(l * 100)}%
          </PillButton>
        ))}
      </div>

      {!pace.isCurrentMonth ? (
        <p className="pace-hint">Soll-Tempo-Vergleich ist nur für den laufenden Kalendermonat verfügbar.</p>
      ) : (
        <>
          <p className="pace-hint">
            Verstrichene Arbeitstage: {pace.elapsedWorkDays} von {pace.totalWorkDays}
          </p>
          <div className="pace-row">
            <span className="pace-row-label">Entscheider-Gespräche</span>
            <span className="pace-row-values">
              Soll bis heute: {formatNumber(pace.decisionCalls.required)} · Ist: {pace.decisionCalls.actual}
            </span>
            <span className={`pace-badge${diffClass(pace.decisionCalls.diff)}`}>{diffLabel(pace.decisionCalls.diff)}</span>
          </div>
          <div className="pace-row">
            <span className="pace-row-label">Durchgeführte Termine</span>
            <span className="pace-row-values">
              Soll bis heute: {formatNumber(pace.heldMeetings.required)} · Ist: {pace.heldMeetings.actual}
            </span>
            <span className={`pace-badge${diffClass(pace.heldMeetings.diff)}`}>{diffLabel(pace.heldMeetings.diff)}</span>
          </div>
        </>
      )}
    </Card>
  )
}
