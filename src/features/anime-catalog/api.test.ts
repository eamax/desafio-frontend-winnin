import { afterEach, describe, expect, it, vi } from 'vitest';
import { CatalogError, fetchAnimePage } from './api';

const anime = {
  id: 1,
  title: { romaji: 'Cowboy Bebop', english: null, native: null },
  coverImage: { large: 'https://example.com/cover.jpg' },
  genres: ['Action'],
  averageScore: 86,
};
const payload = (media: unknown[] = [anime]) => ({
  data: { Page: { media, pageInfo: { currentPage: 1, hasNextPage: true } } },
});
function mockResponse(body: unknown, init?: ResponseInit) {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(JSON.stringify(body), init));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}
const params = { search: '', format: null, page: 1 } as const;

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('fetchAnimePage', () => {
  it('posts a named GraphQL operation with combined variables and abort signal', async () => {
    const fetchMock = mockResponse(payload());
    const signal = new AbortController().signal;
    const result = await fetchAnimePage({
      search: '  Bebop  ',
      format: 'TV',
      page: 2,
      signal,
    });
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://graphql.anilist.co');
    expect(request).toMatchObject({
      method: 'POST',
      signal,
      headers: { 'Content-Type': 'application/json' },
    });
    const body = JSON.parse(request.body);
    expect(body.variables).toEqual({ search: 'Bebop', format: 'TV', page: 2 });
    expect(body.query).toContain('query AnimeCatalog');
    expect(body.query).toContain('perPage: 12');
    expect(result).toEqual({
      items: [
        {
          id: 1,
          title: 'Cowboy Bebop',
          coverImage: 'https://example.com/cover.jpg',
          genres: ['Action'],
          averageScore: 86,
        },
      ],
      currentPage: 1,
      hasNextPage: true,
    });
  });

  it('sends null for an empty search and All Formats', async () => {
    const fetchMock = mockResponse(payload([]));
    expect((await fetchAnimePage(params)).items).toEqual([]);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).variables).toEqual({
      search: null,
      format: null,
      page: 1,
    });
  });

  it('handles nullable fields and title fallbacks without inventing a score', async () => {
    mockResponse(
      payload([
        {
          id: 2,
          title: { english: 'English title' },
          genres: [null, 'Drama', ''],
          averageScore: null,
          coverImage: null,
        },
        { id: 3, title: null, genres: null, averageScore: 0 },
      ]),
    );
    const { items } = await fetchAnimePage(params);
    expect(items).toEqual([
      {
        id: 2,
        title: 'English title',
        genres: ['Drama'],
        averageScore: null,
        coverImage: null,
      },
      {
        id: 3,
        title: 'Sem título',
        genres: [],
        averageScore: 0,
        coverImage: null,
      },
    ]);
  });

  it('rejects GraphQL errors even when HTTP is successful and data is present', async () => {
    mockResponse({ ...payload(), errors: [{ message: 'Failure' }] });
    await expect(fetchAnimePage(params)).rejects.toBeInstanceOf(CatalogError);
  });

  it.each([
    {},
    { data: { Page: null } },
    { data: { Page: { media: [], pageInfo: { currentPage: 1 } } } },
    payload([null]),
    payload([{ id: '1' }]),
  ])('rejects malformed response shape %j', async (body) => {
    mockResponse(body);
    await expect(fetchAnimePage(params)).rejects.toBeInstanceOf(CatalogError);
  });

  it('reports malformed JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('<html>not JSON</html>')),
    );
    await expect(fetchAnimePage(params)).rejects.toBeInstanceOf(CatalogError);
  });

  it('reports HTTP failures and network failures', async () => {
    mockResponse({}, { status: 503 });
    await expect(fetchAnimePage(params)).rejects.toBeInstanceOf(CatalogError);
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new TypeError('Failed to fetch')),
    );
    await expect(fetchAnimePage(params)).rejects.toBeInstanceOf(CatalogError);
  });

  it('preserves aborts for the query client', async () => {
    const controller = new AbortController();
    controller.abort();
    const error = new DOMException('Aborted', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(error));
    await expect(
      fetchAnimePage({ ...params, signal: controller.signal }),
    ).rejects.toBe(error);
  });

  it.each([
    ['30', 30_000],
    ['-1', 60_000],
    ['Sat, 31 Oct 2026 22:02:00 GMT', 120_000],
    [null, 60_000],
    ['invalid', 60_000],
  ])('honors rate limit Retry-After %s', async (header, delay) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-31T22:00:00Z'));
    mockResponse(
      {},
      { status: 429, headers: header ? { 'Retry-After': header } : {} },
    );
    await expect(fetchAnimePage(params)).rejects.toMatchObject({
      retryAt: Date.now() + delay,
    });
  });
});
