import type { ReactNode } from 'react'

interface Props {
  title?: string
  subtitle?: string
  children: ReactNode
  className?: string
}

export function Card({ title, subtitle, children, className }: Props) {
  return (
    <section className={`card${className ? ` ${className}` : ''}`}>
      {title && (
        <header className="card-header">
          <h2>{title}</h2>
          {subtitle && <p className="card-subtitle">{subtitle}</p>}
        </header>
      )}
      {children}
    </section>
  )
}
