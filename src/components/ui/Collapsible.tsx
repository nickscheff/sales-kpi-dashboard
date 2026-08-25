import { useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  className?: string
  children: ReactNode
  /** Kontrollierter Auf/Zu-Zustand. Wenn gesetzt, übernimmt die Komponente keinen eigenen
   * State mehr – `onOpenChange` muss dann den Zustand beim Aufrufer aktualisieren. Ohne
   * diese Props verhält sich die Komponente wie bisher (unkontrollierter interner State). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function Collapsible({ title, subtitle, defaultOpen = false, className, children, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const toggle = () => {
    if (isControlled) {
      onOpenChange?.(!isOpen)
    } else {
      setInternalOpen((prev) => !prev)
    }
  }

  return (
    <section className={`collapsible${className ? ` ${className}` : ''}`}>
      <button type="button" className="collapsible-toggle" onClick={toggle} aria-expanded={isOpen}>
        <span className="collapsible-heading">
          <h2>{title}</h2>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </span>
        <span className="collapsible-chevron" aria-hidden="true">
          {isOpen ? '▾' : '▸'}
        </span>
      </button>
      {isOpen && <div className="collapsible-body">{children}</div>}
    </section>
  )
}
