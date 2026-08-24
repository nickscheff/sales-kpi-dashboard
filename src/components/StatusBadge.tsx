import type { SyncStatus } from '../state/useDashboardData'

const LABELS: Record<SyncStatus, string> = {
  loading: 'Lädt…',
  idle: 'Bereit',
  saving: 'Speichert…',
  saved: 'Gespeichert',
  error: 'Fehler beim Speichern',
}

export function StatusBadge({ status }: { status: SyncStatus }) {
  return <span className={`status-badge status-${status}`}>{LABELS[status]}</span>
}
