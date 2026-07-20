interface Row {
  label: string
  values: (string | number)[]
  bold?: boolean
}

interface Props {
  periods: string[]
  rows: Row[]
  unitNote?: string
}

export default function FinancialTable({ periods, rows, unitNote }: Props) {
  return (
    <div>
      {unitNote && (
        <p className="text-[10px] mb-2" style={{ color: 'var(--color-ink-soft)' }}>
          {unitNote}
        </p>
      )}
      <div className="overflow-x-auto -mx-1">
        <table className="min-w-full text-xs border-collapse">
          <thead>
            <tr>
              <th
                className="text-left font-medium sticky left-0 px-2 py-1.5"
                style={{ color: 'var(--color-ink-soft)', background: 'var(--color-card)' }}
              >
                &nbsp;
              </th>
              {periods.map((p) => (
                <th
                  key={p}
                  className="text-right font-mono font-medium px-2 py-1.5 whitespace-nowrap"
                  style={{ color: 'var(--color-ink-soft)' }}
                >
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t" style={{ borderColor: 'var(--color-paper-line)' }}>
                <td
                  className="text-left px-2 py-1.5 sticky left-0 whitespace-nowrap"
                  style={{
                    color: 'var(--color-ink)',
                    fontWeight: row.bold ? 600 : 400,
                    background: 'var(--color-card)',
                  }}
                >
                  {row.label}
                </td>
                {row.values.map((v, i) => (
                  <td
                    key={i}
                    className="text-right font-mono px-2 py-1.5 whitespace-nowrap"
                    style={{ color: 'var(--color-ink)', fontWeight: row.bold ? 600 : 400 }}
                  >
                    {v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
