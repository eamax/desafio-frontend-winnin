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
  await page.evaluate(() => document.fonts.ready);
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
  await page.evaluate(() => document.fonts.ready);
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
    await page.evaluate(() => document.fonts.ready);
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
  await page.evaluate(() => document.fonts.ready);
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
  await page.evaluate(() => document.fonts.ready);
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
    await page.evaluate(() => document.fonts.ready);
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
      await page.evaluate(() => document.fonts.ready);
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
  await page.evaluate(() => document.fonts.ready);
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
    await page.evaluate(() => document.fonts.ready);
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

test('score badge and format colors match authenticated design tokens', async ({
  page,
}) => {
  const samples = [49, 50, 80, 81, null];
  await page.route('https://graphql.anilist.co', (route) =>
    route.fulfill({
      json: body(
        samples.map((score, index) => ({
          ...item(index + 1),
          averageScore: score,
        })),
      ),
    }),
  );
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('article')).toHaveCount(5);
  const colors = [
    'rgb(233, 33, 81)',
    'rgb(255, 184, 0)',
    'rgb(255, 184, 0)',
    'rgb(1, 173, 166)',
  ];
  for (const [index, score] of samples.entries()) {
    const badge = page.getByLabel(
      score === null ? 'Sem avaliação' : `Avaliação: ${score} de 100`,
      { exact: true },
    );
    if (score === null) {
      await expect(badge).toHaveCSS('color', 'rgb(53, 44, 64)');
      await expect(badge).toHaveCSS('background-color', 'rgb(236, 232, 240)');
      await expect(badge).toHaveText('Sem avaliação');
    } else {
      await expect(badge).toHaveText(`${score}%`);
      await expect(badge).toHaveCSS('color', 'rgb(226, 229, 233)');
      await expect(badge).toHaveCSS('background-color', colors[index]);
      await expect(badge).toHaveCSS('font-weight', '400');
      await expect(badge).toHaveCSS('font-size', '24px');
      await expect(badge).toHaveCSS('font-family', 'Mulish, sans-serif');
    }
  }
  const all = page.getByRole('button', { name: 'All Formats' });
  const movie = page.getByRole('button', { name: 'Movie', exact: true });
  await expect(movie).toHaveCSS('color', 'rgb(99, 36, 198)');
  await expect(movie).toHaveCSS('border-top-color', 'rgb(99, 36, 198)');
  await expect(all).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(all).toHaveCSS('background-color', 'rgb(99, 36, 198)');
  await movie.click();
  await expect(movie).toHaveAttribute('aria-pressed', 'true');
  await expect(movie).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(all).toHaveCSS('color', 'rgb(99, 36, 198)');
  await expect(all).toHaveCSS('border-top-color', 'rgb(99, 36, 198)');
});

test('visual audit load-more and search placeholder corrections', async ({
  page,
}) => {
  await page.route('https://graphql.anilist.co', (route) =>
    route.fulfill({ json: body([item(1)], 1, true) }),
  );
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('article')).toHaveCount(1);
  await expect(page.getByRole('searchbox')).toHaveAttribute(
    'placeholder',
    'Digite algo aqui...',
  );
  const loadMore = page.getByRole('button', { name: 'Ver mais', exact: true });
  await expect(loadMore).toHaveAccessibleName('Ver mais');
  await expect(loadMore).toHaveCSS('color', 'rgb(255, 255, 255)');
  await expect(loadMore).toHaveCSS('font-size', '20px');
  await expect(loadMore).toHaveCSS('font-weight', '600');
  await expect(loadMore).toHaveCSS('border-radius', '8px');
  expect((await loadMore.boundingBox())!.height).toBe(48);
  const icon = loadMore.locator('[aria-hidden="true"]');
  await expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
  await expect(icon).toHaveAttribute('preserveAspectRatio', 'none');
  const cross = icon.locator('path');
  await expect(cross).toHaveCSS('stroke-linecap', 'round');
  await expect(cross).toHaveCSS('stroke-width', '2.286px');
  await expect(cross).toHaveCSS('stroke', 'rgb(255, 255, 255)');
  const shape = await cross.evaluate((path) => {
    const bounds = (path as SVGGraphicsElement).getBBox();
    return { width: bounds.width, height: bounds.height };
  });
  const slot = (await icon.boundingBox())!;
  const label = loadMore.locator('span');
  const labelBox = (await label.boundingBox())!;
  expect(Math.abs(labelBox.width - 101.9)).toBeLessThan(0.02);
  expect(labelBox.height).toBe(25);
  expect(Math.abs(labelBox.x - slot.x - slot.width - 12.43)).toBeLessThan(0.02);
  // Compare individual reference boxes, without stretching the glyphs inside the label.
  const viewportWidth = page.viewportSize()!.width;
  expect(Math.abs(slot.x - (viewportWidth / 2 - 72.7))).toBeLessThan(1.5);
  expect(Math.abs(labelBox.x - (viewportWidth / 2 - 30.45))).toBeLessThan(1.5);

  expect(
    Math.abs(((shape.width + 2.286) * slot.width) / 24 - 19.88),
  ).toBeLessThan(0.03);
  expect(Math.abs(shape.height + 2.286 - 16)).toBeLessThan(0.01);
  expect(Math.abs((await icon.boundingBox())!.width - 29.82)).toBeLessThan(
    0.02,
  );
  expect((await icon.boundingBox())!.height).toBe(24);
  await expect(icon).toHaveCSS('color', 'rgb(255, 255, 255)');
});

test('authenticated Mulish branding and search geometry', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 1212 });
  await page.route('https://graphql.anilist.co', (route) =>
    route.fulfill({ json: body([item(1)], 1, true) }),
  );
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page.evaluate(() => document.fonts.check('400 40px Mulish')),
  ).toBe(true);
  expect(
    await page.evaluate(() =>
      CSS.supports('text-box', 'trim-both cap alphabetic'),
    ),
  ).toBe(true);
  const header = page.getByRole('banner');
  const logo = header.getByRole('heading');
  await expect(logo).toHaveCSS('font-family', 'Mulish, sans-serif');
  await expect(logo).toHaveCSS('font-size', '40px');
  await expect(logo).toHaveCSS('font-weight', '400');
  expect((await header.boundingBox())!.height).toBe(68);
  const hb = (await logo.boundingBox())!;
  // Same local WOFF2, different native font layout: Linux measures234px; macOS235.5px.
  const headerWidthTolerance = process.platform === 'linux' ? 3 : 1.5;
  expect(Math.abs(hb.width - 237)).toBeLessThanOrEqual(headerWidthTolerance);
  expect(Math.abs(hb.height - 28)).toBeLessThan(1);
  expect(Math.abs(hb.y - 20)).toBeLessThan(1);
  const footer = page.getByRole('contentinfo');
  expect((await footer.boundingBox())!.height).toBe(54);
  const footerLogo = footer.locator('p');
  const copyright = footer.locator('small');
  await expect(footerLogo).toHaveCSS('font-size', '24px');
  await expect(copyright).toHaveCSS('font-size', '10px');
  const fb = (await footerLogo.boundingBox())!;
  const cb = (await copyright.boundingBox())!;
  expect(Math.abs(fb.width - 142)).toBeLessThan(1.5);
  expect(Math.abs(cb.width - 169)).toBeLessThan(1.5);
  expect(Math.abs(fb.x + fb.width / 2 - (683 + 8))).toBeLessThan(1);
  expect(Math.abs(cb.x + cb.width / 2 - (683 + 9.5))).toBeLessThan(1);
  expect(Math.abs(cb.y - fb.y - fb.height - 10)).toBeLessThan(1);
  const search = page.getByRole('search');
  const input = page.getByRole('searchbox');
  const submit = page.getByRole('button', { name: 'Buscar', exact: true });
  expect((await search.boundingBox())!.width).toBe(1012);
  expect((await input.boundingBox())!.height).toBe(38);
  expect((await submit.boundingBox())!.width).toBe(86);
  expect((await submit.boundingBox())!.height).toBe(38);
  await expect(input).toHaveCSS('border-top-color', 'rgb(196, 202, 212)');
  expect(
    await input.evaluate((el) => getComputedStyle(el, '::placeholder').color),
  ).toBe('rgb(167, 176, 190)');
  await expect(submit).toHaveCSS('font-size', '14px');
  await expect(submit).toHaveCSS('font-weight', '600');
  const ib = (await input.boundingBox())!;
  const sb = (await submit.boundingBox())!;
  expect(Math.abs(sb.x - ib.x - ib.width - 10.11)).toBeLessThan(0.1);
});

test('authenticated card typography, chip spacing and independent score inset', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 1212 });
  await page.route('https://graphql.anilist.co', (route) =>
    route.fulfill({
      json: body([
        {
          ...item(1, 'Reference title'),
          genres: ['Action', 'Comedy', 'Fantasy'],
          averageScore: 81,
        },
      ]),
    }),
  );
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const card = page.getByRole('article');
  await expect(card).toHaveCount(1);
  const heading = card.getByRole('heading');
  const tags = card.getByRole('list');
  const action = tags.getByRole('listitem').first();
  const score = card.getByLabel('Avaliação: 81 de 100', { exact: true });
  await expect(heading).toHaveCSS('font-family', 'Mulish, sans-serif');
  await expect(heading).toHaveCSS('font-weight', '700');
  await expect(heading).toHaveCSS('font-size', '24px');
  await expect(heading).toHaveCSS('line-height', '30px');
  await expect(heading).toHaveCSS('white-space', 'pre-line');
  await expect(action).toHaveCSS('font-weight', '400');
  await expect(action).toHaveCSS('font-size', '12px');
  await expect(action).toHaveCSS('color', 'rgb(226, 229, 233)');
  await expect(action).toHaveCSS('background-color', 'rgb(119, 77, 197)');
  const cb = (await card.boundingBox())!;
  const hb = (await heading.boundingBox())!;
  const gb = (await tags.boundingBox())!;
  const ab = (await action.boundingBox())!;
  const sb = (await score.boundingBox())!;
  const overlay = await card.evaluate(
    (el) => getComputedStyle(el, '::after').backgroundImage,
  );
  expect(overlay).toMatch(
    /^linear-gradient\((180deg, )?rgba\(0, 0, 0, 0\.85\)( 0%)?, rgba\(0, 0, 0, 0\.17\)( 100%)?\)$/,
  );
  expect(cb.width).toBe(317);
  expect(cb.height).toBe(270);
  expect(hb.x - cb.x).toBe(28);
  expect(hb.y - cb.y).toBe(23);
  expect(gb.y - hb.y - hb.height).toBe(11);
  expect(ab.height).toBe(22);
  expect(sb.width).toBe(68);
  expect(sb.height).toBe(37);
  expect(cb.x + cb.width - sb.x - sb.width).toBe(8);
  expect(cb.y + cb.height - sb.y - sb.height).toBe(8);
});

test('authenticated desktop grid rows and page flow follow reference measurements', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 1212 });
  await page.route('https://graphql.anilist.co', (route) =>
    route.fulfill({
      json: body(
        Array.from({ length: 12 }, (_, i) => ({
          ...item(i + 1),
          genres: ['Action', 'Comedy'],
        })),
        1,
        true,
      ),
    }),
  );
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  await expect(page.getByRole('article')).toHaveCount(12);
  const cards = page.getByRole('article');
  const first = (await cards.nth(0).boundingBox())!;
  const second = (await cards.nth(1).boundingBox())!;
  const rowTwo = (await cards.nth(4).boundingBox())!;
  const rowThree = (await cards.nth(8).boundingBox())!;
  expect(first.x).toBe(25);
  expect(first.y).toBe(210);
  expect(second.x - first.x - first.width).toBe(16);
  expect(rowTwo.y).toBe(501);
  expect(rowThree.y).toBe(792);
  const more = (await page
    .getByRole('button', { name: 'Ver mais', exact: true })
    .boundingBox())!;
  const footer = (await page.getByRole('contentinfo').boundingBox())!;
  expect(more.width).toBe(1316);
  expect(more.y).toBe(1086);
  expect(more.height).toBe(48);
  expect(footer.y).toBe(1158);
  expect(footer.height).toBe(54);
});

test('all authenticated format bounds and typography match the reference group', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 1212 });
  await page.route('https://graphql.anilist.co', (route) =>
    route.fulfill({ json: body([item(1)]) }),
  );
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const reference: [string, number, number][] = [
    ['All Formats', 266, 119],
    ['TV Show', 404, 105],
    ['Movie', 528, 76],
    ['TV Short', 623, 105],
    ['Special', 747, 88],
    ['OVA', 854, 65],
    ['ONA', 938, 67],
    ['Music', 1024, 76],
  ];
  for (const [label, x, width] of reference) {
    const button = page.getByRole('button', { name: label, exact: true });
    const bounds = (await button.boundingBox())!;
    expect(Math.abs(bounds.x - x)).toBeLessThan(0.1);
    expect(bounds.y).toBe(92);
    expect(bounds.width).toBe(width);
    expect(bounds.height).toBe(32);
    await expect(button).toHaveCSS('font-family', 'Mulish, sans-serif');
    await expect(button).toHaveCSS('font-size', '14px');
    await expect(button).toHaveCSS('font-weight', '600');
    await expect(button).toHaveCSS('border-radius', '4px');
    await expect(button).toHaveCSS('border-top-color', 'rgb(99, 36, 198)');
    await expect(button).toHaveCSS(
      'color',
      label === 'All Formats' ? 'rgb(255, 255, 255)' : 'rgb(99, 36, 198)',
    );
  }
  const first = (await page
    .getByRole('button', { name: 'All Formats' })
    .boundingBox())!;
  const last = (await page
    .getByRole('button', { name: 'Music', exact: true })
    .boundingBox())!;
  expect(last.x + last.width - first.x).toBe(834);
});

test('source title hard newline starts a distinct rendered line', async ({
  page,
}) => {
  const title = 'Zom 100: Zombie ni Naru Made\nni Shitai 100 no Koto';
  await page.setViewportSize({ width: 1366, height: 1212 });
  await page.route('https://graphql.anilist.co', (route) =>
    route.fulfill({
      json: body([
        { ...item(1, title), genres: ['Action', 'Comedy', 'Horror'] },
      ]),
    }),
  );
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  const heading = page.getByRole('article').getByRole('heading');
  await expect(heading).toHaveCSS('white-space', 'pre-line');
  const lines = await heading.evaluate((element) => {
    const text = element.firstChild!;
    const value = text.textContent!;
    const newline = value.indexOf('\n');
    const characterTop = (offset: number) => {
      const range = document.createRange();
      range.setStart(text, offset);
      range.setEnd(text, offset + 1);
      return range.getBoundingClientRect().top;
    };
    return {
      previous: characterTop(newline - 1),
      next: characterTop(newline + 1),
    };
  });
  expect(lines.next - lines.previous).toBe(30);
  expect((await heading.boundingBox())!.height).toBe(90);
});
