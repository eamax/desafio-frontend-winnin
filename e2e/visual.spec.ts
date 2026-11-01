import { expect, test } from '@playwright/test';
import { referenceMedia } from './fixtures/catalog';

for (const viewport of [
  { name: 'desktop', width: 1366, height: 1212 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  test(`reference catalog ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
    await page.route('https://graphql.anilist.co', (route) =>
      route.fulfill({
        json: {
          data: {
            Page: {
              media: referenceMedia,
              pageInfo: { currentPage: 1, hasNextPage: true },
            },
          },
        },
      }),
    );
    await page.goto('/');
    await expect(page.getByRole('article')).toHaveCount(12);
    await page.evaluate(async () => {
      await document.fonts.ready;
      // All fixture images must be decoded even below the fold before full-page capture.
      const images = Array.from(document.images);
      images.forEach((image) => {
        image.loading = 'eager';
      });
      await Promise.all(images.map((image) => image.decode()));
    });
    expect(
      await page.evaluate(() =>
        Array.from(document.fonts).some(
          (face) => face.family === 'Mulish' && face.status === 'loaded',
        ),
      ),
    ).toBe(true);
    expect(
      await page.evaluate(() => document.fonts.check('700 24px Mulish')),
    ).toBe(true);
    await expect(
      page.getByRole('heading', {
        name: referenceMedia[3].title.romaji,
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByLabel('Avaliação: 80 de 100', { exact: true }),
    ).toHaveCSS('background-color', 'rgb(255, 184, 0)');
    await expect(page).toHaveScreenshot(`catalog-${viewport.name}.png`, {
      fullPage: true,
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixels: 0,
    });
  });
}
