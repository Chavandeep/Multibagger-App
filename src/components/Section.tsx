import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  children: ReactNode
}

export default function Section({ title, subtitle, children }: Props) {
  return (
    <section className="px-5 md:px-6 mt-5">
      <h2 className="text-base font-semibold" style={{ fontFamily: 'var(--font-display)', color: 'var(--color-ledger-green)' }}>
        {title}
      </h2>
      {subtitle && (
        <p className="text-[11px] mb-2.5" style={{ color: 'var(--color-ink-soft)' }}>
          {subtitle}
        </p>
      )}
      {!subtitle && <div className="mb-2.5" />}
      <div className="rounded-lg border p-3.5" style={{ background: 'var(--color-card)', borderColor: 'var(--color-paper-line)' }}>
        {children}
      </div>
    </section>
  )
}
