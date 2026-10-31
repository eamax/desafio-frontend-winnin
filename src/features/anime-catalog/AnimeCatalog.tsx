import { useEffect, useState, type FormEvent } from 'react';
import { AnimeCard } from './AnimeCard';
import { CatalogError, type AnimeFormat } from './api';
import { useAnimeCatalog } from './useAnimeCatalog';
import styles from './AnimeCatalog.module.css';

const FORMATS: { label: string; value: AnimeFormat | null }[] = [
  { label: 'All Formats', value: null },
  { label: 'TV Show', value: 'TV' },
  { label: 'Movie', value: 'MOVIE' },
  { label: 'TV Short', value: 'TV_SHORT' },
  { label: 'Special', value: 'SPECIAL' },
  { label: 'OVA', value: 'OVA' },
  { label: 'ONA', value: 'ONA' },
  { label: 'Music', value: 'MUSIC' },
];

export function AnimeCatalog() {
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

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextSearch = draft.trim();
    if (coolingDown || nextSearch === search) return;
    catalog.resetPagination(nextSearch, format);
    setSearch(nextSearch);
  }

  function changeFormat(nextFormat: AnimeFormat | null) {
    if (coolingDown || nextFormat === format) return;
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
            placeholder="Buscar anime..."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={coolingDown}
          />
          <button type="submit" disabled={coolingDown}>
            Buscar
          </button>
        </form>
      </div>

      <p
        role="status"
        className={catalog.isPending ? styles.status : styles.srOnly}
      >
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

      {!catalog.isPending && !catalog.isError && catalog.items.length === 0 && (
        <p className={styles.empty}>
          Nenhum anime encontrado. Experimente outro termo ou formato.
        </p>
      )}

      {catalog.items.length > 0 && (
        <div className={styles.grid} aria-busy={catalog.isFetching}>
          {catalog.items.map((anime) => (
            <AnimeCard key={anime.id} anime={anime} />
          ))}
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
          {catalog.isFetchingNextPage ? 'Carregando…' : 'Ver mais'}
        </button>
      )}
    </section>
  );
}
