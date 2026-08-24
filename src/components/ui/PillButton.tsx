import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'ghost'

export function PillButton({
  variant = 'primary',
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`pill pill-${variant}${className ? ` ${className}` : ''}`} {...rest} />
}
