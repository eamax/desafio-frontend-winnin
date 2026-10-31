export type AnimeFormat =
  'TV' | 'TV_SHORT' | 'MOVIE' | 'SPECIAL' | 'OVA' | 'ONA' | 'MUSIC';

export interface Anime {
  id: number;
  title: string;
  coverImage: string | null;
  genres: string[];
  averageScore: number | null;
}

export interface CatalogPage {
  items: Anime[];
  currentPage: number;
  hasNextPage: boolean;
}

export class CatalogError extends Error {
  readonly retryAt: number | null;

  constructor(message: string, retryAt: number | null = null) {
    super(message);
    this.name = 'CatalogError';
    this.retryAt = retryAt;
  }
}

const QUERY = `query AnimeCatalog($search: String, $format: MediaFormat, $page: Int!) {
  Page(page: $page, perPage: 12) {
    pageInfo { currentPage hasNextPage }
    media(type: ANIME, search: $search, format: $format, sort: [POPULARITY_DESC, ID]) {
      id
      title { romaji english native }
      coverImage { large }
      genres
      averageScore
    }
  }
}`;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function retryTime(value: string | null): number {
  const now = Date.now();
  if (value?.trim()) {
    const seconds = Number(value);
    if (Number.isFinite(seconds))
      return seconds >= 0 ? now + seconds * 1000 : now + 60_000;
    const date = Date.parse(value);
    if (Number.isFinite(date)) return Math.max(now, date);
  }
  return now + 60_000;
}

function mapAnime(value: unknown): Anime {
  if (
    !isRecord(value) ||
    !Number.isInteger(value.id) ||
    Number(value.id) <= 0
  ) {
    throw new CatalogError('A API retornou dados inválidos. Tente novamente.');
  }
  const title = isRecord(value.title) ? value.title : {};
  const cover = isRecord(value.coverImage) ? value.coverImage.large : null;
  const titles = [title.romaji, title.english, title.native];
  return {
    id: Number(value.id),
    title:
      titles.find(
        (item): item is string =>
          typeof item === 'string' && item.trim().length > 0,
      ) ?? 'Sem título',
    coverImage: typeof cover === 'string' && cover.trim() ? cover : null,
    genres: Array.isArray(value.genres)
      ? value.genres.filter(
          (item): item is string =>
            typeof item === 'string' && item.trim().length > 0,
        )
      : [],
    averageScore:
      typeof value.averageScore === 'number' &&
      Number.isFinite(value.averageScore) &&
      value.averageScore >= 0 &&
      value.averageScore <= 100
        ? value.averageScore
        : null,
  };
}

export async function fetchAnimePage({
  search,
  format,
  page,
  signal,
}: {
  search: string;
  format: AnimeFormat | null;
  page: number;
  signal?: AbortSignal;
}): Promise<CatalogPage> {
  let response: Response;
  try {
    response = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        query: QUERY,
        variables: { search: search.trim() || null, format, page },
      }),
      signal,
    });
  } catch (error) {
    if (
      signal?.aborted ||
      (error instanceof Error && error.name === 'AbortError')
    )
      throw error;
    throw new CatalogError(
      'Não foi possível conectar à AniList. Tente novamente.',
    );
  }
  if (response.status === 429) {
    throw new CatalogError(
      'Limite de consultas atingido. Aguarde para tentar novamente.',
      retryTime(response.headers.get('Retry-After')),
    );
  }
  if (!response.ok)
    throw new CatalogError('A AniList está indisponível. Tente novamente.');
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new CatalogError(
      'A API retornou uma resposta inválida. Tente novamente.',
    );
  }
  if (!isRecord(result))
    throw new CatalogError(
      'A API retornou uma resposta inválida. Tente novamente.',
    );
  if (Array.isArray(result.errors) && result.errors.length > 0) {
    throw new CatalogError(
      'Não foi possível consultar os animes. Tente novamente.',
    );
  }
  const data = isRecord(result.data) ? result.data : {};
  const catalog = isRecord(data.Page) ? data.Page : {};
  const info = isRecord(catalog.pageInfo) ? catalog.pageInfo : {};
  if (
    !Array.isArray(catalog.media) ||
    !Number.isInteger(info.currentPage) ||
    Number(info.currentPage) < 1 ||
    typeof info.hasNextPage !== 'boolean'
  ) {
    throw new CatalogError('A API retornou dados inválidos. Tente novamente.');
  }
  return {
    items: catalog.media.map(mapAnime),
    currentPage: Number(info.currentPage),
    hasNextPage: info.hasNextPage,
  };
}
