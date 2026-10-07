import { test, expect } from '@playwright/test';

test.describe('Charlie go-home playbook (Find My Puppy Academy handoff)', () => {
	test('loads cover, shows commands, and navigates slides', async ({ page }) => {
		await page.goto('/charlie-go-home-playbook/');

		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		await expect(page.getByRole('heading', { level: 1, name: /Charlie/ })).toBeVisible();

		const cover = page.locator('.cover-photo');
		await expect(cover).toBeVisible();
		const naturalWidth = await cover.evaluate((img: HTMLImageElement) => img.naturalWidth);
		expect(naturalWidth).toBeGreaterThan(0);

		await page.getByRole('button', { name: /Next slide/i }).click();
		await expect(page.getByRole('heading', { level: 2, name: /Who Charlie is/i })).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 4' }).click();
		await expect(page.getByRole('heading', { level: 3, name: 'Free' })).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 5' }).click();
		await expect(page.getByRole('heading', { level: 2, name: /Training concepts/i })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: 'The scoreboard' })).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 7' }).click();
		await expect(page.getByRole('heading', { level: 3, name: 'Hurry Up' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: 'Ven' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: 'Vamos' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: 'Go to sleep' })).toBeVisible();
	});

	test('slide dots jump to closing section', async ({ page }) => {
		await page.goto('/charlie-go-home-playbook/');
		await page.getByRole('button', { name: 'Go to slide 9' }).click();
		await expect(page.getByRole('heading', { level: 2, name: /not on your own/i })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: /homework plan/i })).toBeVisible();
	});

	test('no horizontal overflow on mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/charlie-go-home-playbook/');
		const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientW = await page.evaluate(() => document.documentElement.clientWidth);
		expect(scrollW).toBeLessThanOrEqual(clientW + 1);
	});
});
