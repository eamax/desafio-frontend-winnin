import { test, expect } from '@playwright/test';

const item = (id: number, title = `Anime ${id}`) => ({
  id,
  title: { romaji: title },
  coverImage: null,
  genres: [
    'Action',
    'Adventure',
    'Drama',
    'Comedy',
    'Fantasy',
    'Sci-Fi',
    'Mystery',
    'Supernatural',
  ],
  averageScore: [49, 50, 80, 81][id % 4],
});
const body = (
  media: ReturnType<typeof item>[],
  page = 1,
  hasNextPage = false,
) => ({
  data: { Page: { media, pageInfo: { currentPage: page, hasNextPage } } },
});

test('search, format, pagination, clearing and keyboard', async ({ page }) => {
  const calls: Record<string, unknown>[] = [];
  await page.route('https://graphql.anilist.co', (route) => {
    const { variables } = route.request().postDataJSON();
    calls.push(variables);
    const title = variables.search || 'Inicial';
    return route.fulfill({
      json: body(
        [
          item(
            variables.page,
            `${title} ${variables.format || 'All'} ${variables.page}`,
          ),
        ],
        variables.page,
        variables.page === 1,
      ),
    });
  });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Inicial All 1' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ver mais' }).click();
  await expect(
    page.getByRole('heading', { name: 'Inicial All 2' }),
  ).toBeVisible();
  await page.getByRole('searchbox').fill('Bebop');
  await page.getByRole('searchbox').press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Bebop All 1' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'TV Show', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bebop TV 1' })).toBeVisible();
  expect(calls.at(-1)).toEqual({ search: 'Bebop', format: 'TV', page: 1 });
  await expect(
    page.getByRole('heading', { name: 'Inicial All 2' }),
  ).toHaveCount(0);
  await page.getByRole('searchbox').fill('');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await page.getByRole('button', { name: 'All Formats' }).click();
  await expect(
    page.getByRole('heading', { name: 'Inicial All 1' }),
  ).toBeVisible();
});

test('recoverable GraphQL error', async ({ page }) => {
  let failed = true;
  await page.route('https://graphql.anilist.co', (route) =>
    route.fulfill({
      json: failed ? { errors: [{ message: 'unavailable' }] } : body([item(1)]),
    }),
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toBeVisible();
  failed = false;
  await page.getByRole('button', { name: 'Tentar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'Anime 1' })).toBeVisible();
});

for (const [width, columns] of [
  [1440, 4],
  [1024, 4],
  [768, 2],
  [390, 1],
] as const) {
  test(`responsive visual evidence ${width}`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.route('https://graphql.anilist.co', (route) =>
      route.fulfill({
        json: body(
          Array.from({ length: 12 }, (_, i) =>
            item(
              i + 1,
              i === 0
                ? 'Um título muito longo que deve continuar legível sem cobrir a avaliação do anime'
                : `Anime ${i + 1}`,
            ),
          ),
          1,
          true,
        ),
      }),
    );
    await page.goto('/');
    await expect(page.getByRole('article')).toHaveCount(12);
    expect(
      await page.locator('body').evaluate((el) => el.scrollWidth),
    ).toBeLessThanOrEqual(width);
    const cards = page.getByRole('article');
    const first = await cards.nth(0).boundingBox();
    const nextRow = await cards.nth(columns).boundingBox();
    expect(nextRow!.y).toBeGreaterThan(first!.y);
    if (columns > 1)
      expect((await cards.nth(1).boundingBox())!.y).toBe(first!.y);
    await expect(
      page.getByLabel('Avaliação: 50 de 100', { exact: true }).first(),
    ).toBeVisible();
    for (const card of await cards.all()) {
      const score = card.getByLabel(/Avaliação:/);
      const cb = await card.boundingBox();
      const sb = await score.boundingBox();
      expect(sb!.y + sb!.height).toBeLessThanOrEqual(cb!.y + cb!.height);
    }
    await page.screenshot({
      path: testInfo.outputPath(`catalog-${width}.png`),
      fullPage: true,
    });
  });
}

test('text zoom 200 percent preserves card content', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 1000 });
  await page.route('https://graphql.anilist.co', (route) =>
    route.fulfill({
      json: body([
        item(
          1,
          'Um título longo para testar acessibilidade e avaliação em tamanhos maiores',
        ),
      ]),
    }),
  );
  await page.goto('/');
  await expect(page.getByRole('article')).toHaveCount(1);
  await page.locator('html').evaluate((el) => (el.style.fontSize = '200%'));
  const card = await page.getByRole('article').boundingBox();
  const score = await page
    .getByLabel('Avaliação: 50 de 100', { exact: true })
    .boundingBox();
  expect(score!.y + score!.height).toBeLessThanOrEqual(card!.y + card!.height);
  expect(
    await page.locator('body').evaluate((el) => el.scrollWidth),
  ).toBeLessThanOrEqual(1024);
});

test('initial skeleton loading is visible while the API is pending', async ({
  page,
}) => {
  let release: (() => Promise<void>) | undefined;
  await page.route('https://graphql.anilist.co', (route) => {
    release = () => route.fulfill({ json: body([item(1)]) });
  });
  await page.goto('/');
  await expect(page.getByTestId('skeleton-grid')).toBeVisible();
  await expect(page.getByTestId('skeleton-card')).toHaveCount(12);
  await expect(page.getByTestId('skeleton-grid')).toHaveAttribute(
    'aria-hidden',
    'true',
  );
  await expect(page.getByRole('status')).toHaveText('Carregando animes…');
  await expect.poll(() => Boolean(release)).toBe(true);
  await release!();
  await expect(page.getByRole('heading', { name: 'Anime 1' })).toBeVisible();
});

for (const count of [0, 1, 24]) {
  test(`footer follows content and reaches viewport bottom for ${count} results`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await page.route('https://graphql.anilist.co', (route) =>
      route.fulfill({
        json: body(Array.from({ length: count }, (_, i) => item(i + 1))),
      }),
    );
    await page.goto('/');
    if (count) await expect(page.getByRole('article')).toHaveCount(count);
    else await expect(page.getByText(/Nenhum anime encontrado/)).toBeVisible();
    const footer = await page.getByRole('contentinfo').boundingBox();
    const main = await page.getByRole('main').boundingBox();
    expect(footer!.y).toBeGreaterThanOrEqual(main!.y + main!.height);
    if (count < 2)
      expect(Math.abs(footer!.y + footer!.height - 900)).toBeLessThan(1);
    else expect(footer!.y).toBeGreaterThan(900);
  });
}

for (const count of [1, 24]) {
  for (const action of ['filter', 'search']) {
    test(`pending ${action} preserves result geometry after ${count} results`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1366, height: 900 });
      let release: (() => Promise<void>) | undefined;
      await page.route('https://graphql.anilist.co', (route) => {
        const { variables } = route.request().postDataJSON();
        if (variables.format === 'MOVIE' || variables.search === 'new') {
          release = () =>
            route.fulfill({ json: body([item(100, 'New result')]) });
          return;
        }
        const length = count === 1 ? 1 : 12;
        const offset = (variables.page - 1) * length;
        return route.fulfill({
          json: body(
            Array.from({ length }, (_, i) => item(offset + i + 1)),
            variables.page,
            true,
          ),
        });
      });
      await page.goto('/');
      await expect(page.getByRole('article')).toHaveCount(count === 1 ? 1 : 12);
      if (count === 24) {
        await page.getByRole('button', { name: 'Ver mais' }).click();
        await expect(page.getByRole('article')).toHaveCount(24);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      const oldTop = (await page.getByRole('article').first().boundingBox())!.y;
      const oldFooter = (await page.getByRole('contentinfo').boundingBox())!.y;
      if (action === 'filter')
        await page.getByRole('button', { name: 'Movie' }).click();
      else {
        await page.getByRole('searchbox').fill('new');
        await page.getByRole('button', { name: 'Buscar', exact: true }).click();
      }
      await expect(page.getByTestId('skeleton-card')).toHaveCount(count);
      await expect(page.getByRole('article')).toHaveCount(0);
      const skeleton = await page.getByTestId('skeleton-grid').boundingBox();
      const pendingFooter = await page.getByRole('contentinfo').boundingBox();
      expect(Math.abs(skeleton!.y - oldTop)).toBeLessThan(1);
      expect(Math.abs(pendingFooter!.y - oldFooter)).toBeLessThan(1);
      await expect.poll(() => Boolean(release)).toBe(true);
      await release!();
      await expect(
        page.getByRole('heading', { name: 'New result' }),
      ).toBeVisible();
      await expect(page.getByTestId('skeleton-grid')).toHaveCount(0);
    });
  }
}

test('reduced-motion loading is static and additional-page loading preserves cards', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  let release: (() => Promise<void>) | undefined;
  await page.route('https://graphql.anilist.co', (route) => {
    const { variables } = route.request().postDataJSON();
    release = () =>
      route.fulfill({
        json: body(
          [item(variables.page)],
          variables.page,
          variables.page === 1,
        ),
      });
  });
  await page.goto('/');
  await expect(page.getByTestId('skeleton-card')).toHaveCount(12);
  await expect(page.getByTestId('skeleton-card').first()).toHaveCSS(
    'animation-name',
    'none',
  );
  await expect.poll(() => Boolean(release)).toBe(true);
  await release!();
  await expect(page.getByRole('article')).toHaveCount(1);
  release = undefined;
  await page.getByRole('button', { name: 'Ver mais' }).click();
  await expect.poll(() => Boolean(release)).toBe(true);
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByTestId('skeleton-card')).toHaveCount(12);
  await expect(
    page.getByRole('button', { name: 'Carregando…' }),
  ).toBeDisabled();
  await expect(page.getByRole('status')).toHaveText('Carregando mais animes…');
  await release!();
  await expect(page.getByRole('article')).toHaveCount(2);
});

for (const [width, height] of [
  [1440, 900],
  [390, 844],
  [390, 400],
]) {
  test(`empty to pending preserves compact result and footer geometry ${width}x${height}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    let release: (() => Promise<void>) | undefined;
    await page.route('https://graphql.anilist.co', (route) => {
      const { variables } = route.request().postDataJSON();
      if (variables.search === 'new') {
        release = () => route.fulfill({ json: body([item(1)]) });
        return;
      }
      return route.fulfill({ json: body([]) });
    });
    await page.goto('/');
    await expect(page.getByText(/Nenhum anime encontrado/)).toBeVisible();
    const geometry = () =>
      page.evaluate(() => {
        const results = document
          .querySelector('[data-testid="results-area"]')!
          .getBoundingClientRect();
        const footer = document
          .querySelector('footer')!
          .getBoundingClientRect();
        return {
          top: results.top + window.scrollY,
          height: results.height,
          footer: footer.top + window.scrollY,
        };
      });
    const before = await geometry();
    await page.getByRole('searchbox').fill('new');
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await expect(page.getByTestId('compact-skeleton')).toBeVisible();
    await expect(page.getByTestId('compact-skeleton')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await expect(page.getByTestId('compact-skeleton')).toHaveCSS(
      'animation-name',
      'none',
    );
    await expect(page.getByTestId('skeleton-card')).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveText('Carregando animes…');
    const pending = await geometry();
    expect(Math.abs(pending.top - before.top)).toBeLessThan(1);
    expect(Math.abs(pending.height - before.height)).toBeLessThan(1);
    expect(Math.abs(pending.footer - before.footer)).toBeLessThan(1);
    await expect.poll(() => Boolean(release)).toBe(true);
    await release!();
    await expect(page.getByRole('article')).toHaveCount(1);
    await expect(page.getByTestId('compact-skeleton')).toHaveCount(0);
  });
}
