import { test, expect } from '@playwright/test';

test.describe('Stella go-home playbook (Foundations handoff)', () => {
	test('loads cover, shows dynamic age, and navigates slides', async ({ page }) => {
		await page.goto('/stella-go-home-playbook/');

		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);

		await expect(page.getByRole('heading', { level: 1, name: /Stella/ })).toBeVisible();

		const age = page.locator('.pup-age-weeks[data-birthdate]').first();
		await expect(age).toBeVisible();
		await expect(age).toContainText(/weeks? old|months? old/i, { timeout: 10_000 });

		await expect(page.getByRole('heading', { level: 2, name: /Yes · Good · Free/i })).not.toBeVisible();

		await page.getByRole('button', { name: /Next slide/i }).click();
		await expect(page.getByRole('heading', { level: 2, name: /Yes · Good · Free/i })).toBeVisible();

		await page.keyboard.press('ArrowLeft');
		await expect(page.getByRole('heading', { level: 1, name: /Stella/ })).toBeVisible();

		const cover = page.locator('.cover-photo');
		await expect(cover).toBeVisible();
		const naturalWidth = await cover.evaluate((img: HTMLImageElement) => img.naturalWidth);
		expect(naturalWidth).toBeGreaterThan(0);
	});

	test('slide dots jump to closing section', async ({ page }) => {
		await page.goto('/stella-go-home-playbook/');
		await page.getByRole('button', { name: 'Go to slide 8' }).click();
		await expect(page.getByRole('heading', { level: 2, name: /not on your own/i })).toBeVisible();
	});

	test('no horizontal overflow on mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/stella-go-home-playbook/');
		const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientW = await page.evaluate(() => document.documentElement.clientWidth);
		expect(scrollW).toBeLessThanOrEqual(clientW + 1);
	});
});
