import { ChevronLeft, Search, SearchX, X } from 'lucide-react'
import { useMemo, type ReactElement } from 'react'
import { Link, useSearchParams } from 'react-router'
import { previewText, searchableText, sourceLine } from '../../content/describe.ts'
import { allEntries, collectionPath, collectionsContaining, getEntry } from '../../content/index.ts'
import { buildSearchIndex, search, type SearchIndex } from '../../domain/search/search.ts'
import { formatNumber, t } from '../../i18n/t.ts'
import { EmptyState } from '../../ui/EmptyState.tsx'
import { PageHeader } from '../../ui/PageHeader.tsx'

let cachedIndex: SearchIndex | undefined

function searchIndex(): SearchIndex {
  cachedIndex ??= buildSearchIndex(
    allEntries.map((entry) => ({
      id: entry.id,
      text: [searchableText(entry), ...collectionsContaining(entry.id).map((collection) => collection.title)].join(' '),
    })),
  )
  return cachedIndex
}

export function SearchPage(): ReactElement {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const results = useMemo(() => search(searchIndex(), query), [query])
  const setQuery = (next: string): void => setParams(next === '' ? {} : { q: next }, { replace: true })

  return (
    <div className="mx-auto max-w-[720px]">
      <PageHeader title={t.search.title} backTo="/" actions={<span />} />
      <div role="search" className="relative mb-5">
        <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted" aria-hidden="true" />
        <input
          type="search"
          inputMode="search"
          enterKeyHint="search"
          autoFocus
          autoComplete="off"
          aria-label={t.search.placeholder}
          placeholder={t.search.placeholder}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-14 w-full rounded-[22px] border border-line bg-surface ps-12 pe-12 text-base text-ink shadow-card outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-muted/70 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 [&::-webkit-search-cancel-button]:hidden"
        />
        {query !== '' && (
          <button type="button" aria-label={t.search.clear} onClick={() => setQuery('')} className="absolute end-2 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-surface-alt">
            <X className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <p className="sr-only" role="status">
        {query === '' ? '' : `${t.search.results}: ${formatNumber(results.length)}`}
      </p>

      {query.trim() === '' ? (
        <p className="px-2 text-sm text-muted">{t.search.hint}</p>
      ) : results.length === 0 ? (
        <EmptyState icon={SearchX} title={t.search.noResultsTitle} body={t.search.noResultsBody} />
      ) : (
        <ul className="space-y-3">
          {results.map((id) => {
            const entry = getEntry(id)
            const collection = collectionsContaining(id)[0]
            if (!entry || !collection) return null
            return (
              <li key={id}>
                <Link
                  to={`${collectionPath(collection)}?focus=${encodeURIComponent(id)}`}
                  className="group flex items-center gap-3 rounded-[22px] border border-line bg-surface px-5 py-4 shadow-card transition-[border-color,transform] duration-200 hover:border-primary/30 active:scale-[0.99]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="scripture line-clamp-2 block text-[1.2rem]! leading-[2]! text-ink">{previewText(entry)}</span>
                    <span className="mt-1 block truncate text-xs text-muted">{collection.title} · {sourceLine(entry)}</span>
                  </span>
                  <ChevronLeft className="size-5 shrink-0 text-muted/60 group-hover:text-primary" aria-hidden="true" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
