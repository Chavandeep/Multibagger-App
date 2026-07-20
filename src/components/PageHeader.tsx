import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
}

export default function PageHeader({ title, subtitle, action }: Props) {
  return (
    <header className="px-5 md:px-6 pt-6 pb-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1
            className="text-[26px] leading-tight font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ledger-green)' }}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm mt-1" style={{ color: 'var(--color-ink-soft)' }}>
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </div>
    </header>
  )
}
