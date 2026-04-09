'use client'

type Props = {
  draft: string
  onDraftChange: (v: string) => void
  onSearch: () => void
  placeholder?: string
}

/** Search runs only when the user clicks Search (no live filtering on keystroke). */
export function SearchToolbar({ draft, onDraftChange, onSearch, placeholder }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4">
      <input
        className="flex-1 min-w-[200px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
        value={draft}
        onChange={(e) => onDraftChange(e.target.value)}
        placeholder={placeholder || 'Search…'}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSearch()
        }}
      />
      <button
        type="button"
        onClick={onSearch}
        className="rounded-[var(--radius-md)] bg-[linear-gradient(135deg,var(--accent),var(--accent-2))] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] shadow-sm hover:brightness-95"
      >
        Search
      </button>
    </div>
  )
}
