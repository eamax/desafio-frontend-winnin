import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimeCard } from './AnimeCard';
import { CatalogError, type AnimeFormat } from './api';
import { useAnimeCatalog } from './useAnimeCatalog';
import styles from './AnimeCatalog.module.css';

const FORMATS: {
  label: string;
  value: AnimeFormat | null;
  minWidth: number;
}[] = [
  { label: 'All Formats', minWidth: 119, value: null },
  { label: 'TV Show', minWidth: 105, value: 'TV' },
  { label: 'Movie', minWidth: 76, value: 'MOVIE' },
  { label: 'TV Short', minWidth: 105, value: 'TV_SHORT' },
  { label: 'Special', minWidth: 88, value: 'SPECIAL' },
  { label: 'OVA', minWidth: 65, value: 'OVA' },
  { label: 'ONA', minWidth: 67, value: 'ONA' },
  { label: 'Music', minWidth: 76, value: 'MUSIC' },
];

function SkeletonCards({ count }: { count: number }) {
  return Array.from({ length: count }, (_, index) => (
    <div
      className={styles.skeleton}
      key={index}
      aria-hidden="true"
      data-testid="skeleton-card"
    >
      <div className={styles.skeletonTitle} />
      <div className={styles.skeletonGenre} />
      <div className={styles.skeletonScore} />
    </div>
  ));
}

export function AnimeCatalog() {
  const resultsRef = useRef<HTMLDivElement>(null);
  const [pendingLayout, setPendingLayout] = useState({ count: 12, height: 0 });
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState<AnimeFormat | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const catalog = useAnimeCatalog(search, format);
  const retryAt =
    catalog.error instanceof CatalogError ? catalog.error.retryAt : null;
  const secondsLeft =
    retryAt === null ? 0 : Math.max(0, Math.ceil((retryAt - now) / 1000));
  const coolingDown = secondsLeft > 0;

  useEffect(() => {
    if (retryAt === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [retryAt]);

  function reserveResults() {
    if (catalog.isPending) return;
    setPendingLayout({
      count: catalog.items.length,
      height: resultsRef.current?.getBoundingClientRect().height ?? 0,
    });
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSearch = draft.trim();
    if (coolingDown || nextSearch === search) return;
    reserveResults();
    catalog.resetPagination(nextSearch, format);
    setSearch(nextSearch);
  }

  function changeFormat(nextFormat: AnimeFormat | null) {
    if (coolingDown || nextFormat === format) return;
    reserveResults();
    catalog.resetPagination(search, nextFormat);
    setFormat(nextFormat);
  }

  function retry() {
    if (coolingDown || catalog.isFetching) return;
    void (catalog.isFetchNextPageError
      ? catalog.fetchNextPage()
      : catalog.refetch());
  }

  return (
    <section className={styles.catalog} aria-label="Catálogo de animes">
      <div className={styles.controls}>
        <div
          className={styles.formats}
          role="group"
          aria-label="Filtrar por formato"
        >
          {FORMATS.map((item) => (
            <button
              key={item.label}
              type="button"
              aria-pressed={format === item.value}
              className={styles.format}
              style={{ minWidth: item.minWidth }}
              disabled={coolingDown}
              onClick={() => changeFormat(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <form className={styles.search} onSubmit={submitSearch} role="search">
          <label htmlFor="anime-search" className={styles.srOnly}>
            Buscar animes
          </label>
          <input
            id="anime-search"
            name="search"
            type="search"
            placeholder="Digite algo aqui..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={coolingDown}
          />
          <button type="submit" disabled={coolingDown}>
            <span>Buscar</span>
          </button>
        </form>
      </div>

      <p role="status" className={styles.srOnly}>
        {catalog.isPending
          ? 'Carregando animes…'
          : catalog.isFetchingNextPage
            ? 'Carregando mais animes…'
            : catalog.isFetching
              ? 'Atualizando animes…'
              : catalog.items.length > 0
                ? `${catalog.items.length} animes encontrados`
                : ''}
      </p>
      <div
        ref={resultsRef}
        data-testid="results-area"
        className={styles.results}
        aria-busy={catalog.isFetching}
        style={
          catalog.isPending ? { minHeight: pendingLayout.height } : undefined
        }
      >
        {catalog.isPending && pendingLayout.count === 0 && (
          <div
            className={styles.compactSkeleton}
            aria-hidden="true"
            data-testid="compact-skeleton"
          >
            <div className={styles.skeletonTitle} />
            <div className={styles.skeletonGenre} />
          </div>
        )}
        {catalog.isPending && pendingLayout.count > 0 && (
          <div
            className={styles.grid}
            aria-hidden="true"
            data-testid="skeleton-grid"
          >
            <SkeletonCards count={pendingLayout.count} />
          </div>
        )}

        {catalog.isError && (
          <div className={styles.error} role="alert">
            <p>
              {catalog.error instanceof Error
                ? catalog.error.message
                : 'Não foi possível consultar os animes.'}
            </p>
            {coolingDown && (
              <p>Aguarde {secondsLeft} segundos para tentar novamente.</p>
            )}
            <button
              type="button"
              onClick={retry}
              disabled={coolingDown || catalog.isFetching}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {!catalog.isPending &&
          !catalog.isError &&
          catalog.items.length === 0 && (
            <p className={styles.empty}>
              Nenhum anime encontrado. Experimente outro termo ou formato.
            </p>
          )}

        {catalog.items.length > 0 && (
          <div className={styles.grid} aria-busy={catalog.isFetching}>
            {catalog.items.map((anime) => (
              <AnimeCard key={anime.id} anime={anime} />
            ))}
            {catalog.isFetchingNextPage && <SkeletonCards count={12} />}
          </div>
        )}

        {catalog.hasNextPage && (
          <button
            className={styles.loadMore}
            type="button"
            onClick={() => {
              void catalog.fetchNextPage();
            }}
            disabled={coolingDown || catalog.isFetching}
          >
            {!catalog.isFetchingNextPage && (
              <svg
                aria-hidden="true"
                focusable="false"
                className={styles.loadMoreIcon}
                viewBox="0 0 24 24"
                preserveAspectRatio="none"
              >
                <path
                  d="M5.143 12H18.857M12 5.143V18.857"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.286"
                  strokeLinecap="round"
                />
              </svg>
            )}
            <span className={styles.loadMoreLabel}>
              {catalog.isFetchingNextPage ? 'Carregando…' : 'Ver mais'}
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
