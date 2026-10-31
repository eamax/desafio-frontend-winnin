import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { graphql, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { AnimeCatalog } from './AnimeCatalog';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const anime = (id: number, title: string) => ({
  id,
  title: { romaji: title },
  coverImage: null,
  genres: ['Action'],
  averageScore: 80,
});
const response = (
  items: ReturnType<typeof anime>[],
  page = 1,
  hasNextPage = false,
) => ({
  data: {
    Page: { media: items, pageInfo: { currentPage: page, hasNextPage } },
  },
});
function renderCatalog(gcTime = 0) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime } },
  });
  return {
    ...render(
      <QueryClientProvider client={client}>
        <AnimeCatalog />
      </QueryClientProvider>,
    ),
    user: userEvent.setup(),
    client,
  };
}

describe('AnimeCatalog', () => {
  it('submits search only on demand, combines format and restarts pagination', async () => {
    const calls: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AnimeCatalog', ({ variables }) => {
        calls.push(variables);
        const page = Number(variables.page);
        const title = variables.search
          ? `Resultado ${variables.search} ${variables.format ?? 'All'}`
          : 'Inicial';
        return HttpResponse.json(
          response([anime(page, `${title} ${page}`)], page, page === 1),
        );
      }),
    );
    const { user } = renderCatalog();
    await screen.findByRole('heading', { name: 'Inicial 1' });
    await user.click(screen.getByRole('button', { name: 'Ver mais' }));
    await screen.findByRole('heading', { name: 'Inicial 2' });
    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar animes' }),
      '  Bebop  ',
    );
    expect(calls).toHaveLength(2);
    await user.click(screen.getByRole('button', { name: 'Buscar' }));
    await screen.findByRole('heading', { name: 'Resultado Bebop All 1' });
    expect(
      screen.queryByRole('heading', { name: 'Inicial 2' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'TV Show' }));
    await screen.findByRole('heading', { name: 'Resultado Bebop TV 1' });
    expect(calls.at(-1)).toMatchObject({
      search: 'Bebop',
      format: 'TV',
      page: 1,
    });
    expect(screen.getByRole('button', { name: 'TV Show' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('appends pages, deduplicates IDs and hides load more at the end', async () => {
    server.use(
      graphql.query('AnimeCatalog', ({ variables }) =>
        HttpResponse.json(
          Number(variables.page) === 1
            ? response([anime(1, 'Bebop')], 1, true)
            : response([anime(1, 'Bebop'), anime(2, 'Naruto')], 2),
        ),
      ),
    );
    const { user } = renderCatalog();
    await screen.findByRole('heading', { name: 'Bebop' });
    await user.click(screen.getByRole('button', { name: 'Ver mais' }));
    await screen.findByRole('heading', { name: 'Naruto' });
    expect(screen.getAllByRole('heading', { name: 'Bebop' })).toHaveLength(1);
    expect(
      screen.queryByRole('button', { name: 'Ver mais' }),
    ).not.toBeInTheDocument();
  });

  it('returns to the first cached page when revisiting previous criteria', async () => {
    const calls: Record<string, unknown>[] = [];
    server.use(
      graphql.query('AnimeCatalog', ({ variables }) => {
        calls.push(variables);
        const page = Number(variables.page);
        const movie = variables.format === 'MOVIE';
        return HttpResponse.json(
          response(
            [
              anime(
                movie ? 10 : page,
                movie ? 'Movie result' : `Initial page ${page}`,
              ),
            ],
            page,
            !movie && page === 1,
          ),
        );
      }),
    );
    const { user, client } = renderCatalog(60_000);
    await screen.findByRole('heading', { name: 'Initial page 1' });
    await user.click(screen.getByRole('button', { name: 'Ver mais' }));
    await screen.findByRole('heading', { name: 'Initial page 2' });
    const cachedAt = client.getQueryState(['anime', '', null])?.dataUpdatedAt;
    await user.click(screen.getByRole('button', { name: 'Movie' }));
    await screen.findByRole('heading', { name: 'Movie result' });
    await user.click(screen.getByRole('button', { name: 'All Formats' }));
    await screen.findByRole('heading', { name: 'Initial page 1' });
    expect(
      screen.queryByRole('heading', { name: 'Initial page 2' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ver mais' })).toBeEnabled();
    expect(calls).toHaveLength(3);
    expect(client.getQueryState(['anime', '', null])?.dataUpdatedAt).toBe(
      cachedAt,
    );
    client.clear();
  });

  it('shows an empty state', async () => {
    server.use(
      graphql.query('AnimeCatalog', () => HttpResponse.json(response([]))),
    );
    renderCatalog();
    expect(
      await screen.findByText(/Nenhum anime encontrado/),
    ).toBeInTheDocument();
  });

  it('recovers from GraphQL errors returned with HTTP 200', async () => {
    let fail = true;
    server.use(
      graphql.query('AnimeCatalog', () => {
        if (fail)
          return HttpResponse.json({ errors: [{ message: 'Unavailable' }] });
        return HttpResponse.json(response([anime(1, 'Recuperado')]));
      }),
    );
    const { user } = renderCatalog();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível consultar',
    );
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByRole('heading', { name: 'Recuperado' });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('preserves existing cards on additional-page errors and retries that page', async () => {
    let fail = true;
    const pages: number[] = [];
    server.use(
      graphql.query('AnimeCatalog', ({ variables }) => {
        const page = Number(variables.page);
        pages.push(page);
        if (page === 1)
          return HttpResponse.json(response([anime(1, 'Primeiro')], 1, true));
        if (fail) return HttpResponse.json({}, { status: 503 });
        return HttpResponse.json(response([anime(2, 'Segundo')], 2));
      }),
    );
    const { user } = renderCatalog();
    await screen.findByRole('heading', { name: 'Primeiro' });
    await user.click(screen.getByRole('button', { name: 'Ver mais' }));
    await screen.findByRole('alert');
    expect(
      screen.getByRole('heading', { name: 'Primeiro' }),
    ).toBeInTheDocument();
    fail = false;
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByRole('heading', { name: 'Segundo' });
    expect(pages).toEqual([1, 2, 2]);
  });

  it('keeps the newest format when an older request completes later', async () => {
    let resolveOld: (() => void) | undefined;
    server.use(
      graphql.query('AnimeCatalog', async ({ variables }) => {
        if (variables.format == null) {
          await new Promise<void>((resolve) => {
            resolveOld = resolve;
          });
          return HttpResponse.json(response([anime(1, 'Antigo')]));
        }
        return HttpResponse.json(response([anime(2, 'Novo TV')]));
      }),
    );
    const { user } = renderCatalog();
    await waitFor(() => expect(resolveOld).toBeDefined());
    await user.click(screen.getByRole('button', { name: 'TV Show' }));
    await screen.findByRole('heading', { name: 'Novo TV' });
    resolveOld?.();
    expect(
      screen.queryByRole('heading', { name: 'Antigo' }),
    ).not.toBeInTheDocument();
  });

  it('disables requests during Retry-After and allows recovery after the cooldown', async () => {
    let calls = 0;
    server.use(
      graphql.query('AnimeCatalog', () => {
        calls++;
        if (calls === 1)
          return HttpResponse.json(
            {},
            { status: 429, headers: { 'Retry-After': '1' } },
          );
        return HttpResponse.json(response([anime(1, 'Após espera')]));
      }),
    );
    const { user } = renderCatalog();
    await screen.findByRole('alert');
    expect(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Buscar' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Movie' })).toBeDisabled();
    expect(calls).toBe(1);
    await waitFor(
      () =>
        expect(
          screen.getByRole('button', { name: 'Tentar novamente' }),
        ).toBeEnabled(),
      { timeout: 2500 },
    );
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await screen.findByRole('heading', { name: 'Após espera' });
    expect(calls).toBe(2);
  });
});
