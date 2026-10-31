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

test('initial loading is visible while the API is pending', async ({
  page,
}) => {
  let release: (() => Promise<void>) | undefined;
  await page.route('https://graphql.anilist.co', (route) => {
    release = () => route.fulfill({ json: body([item(1)]) });
  });
  await page.goto('/');
  await expect(page.getByRole('status')).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Carregando animes…');
  await expect.poll(() => Boolean(release)).toBe(true);
  await release!();
  await expect(page.getByRole('heading', { name: 'Anime 1' })).toBeVisible();
});
