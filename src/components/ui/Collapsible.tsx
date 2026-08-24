import { useState } from 'react'
import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  defaultOpen?: boolean
  children: ReactNode
}

export function Collapsible({ title, subtitle, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className="collapsible">
      <button
        type="button"
        className="collapsible-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <span className="collapsible-heading">
          <h2>{title}</h2>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </span>
        <span className="collapsible-chevron" aria-hidden="true">
          {open ? '▾' : '▸'}
        </span>
      </button>
      {open && <div className="collapsible-body">{children}</div>}
    </section>
  )
}
