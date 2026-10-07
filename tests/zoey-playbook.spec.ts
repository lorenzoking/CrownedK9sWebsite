import { test, expect } from '@playwright/test';
import { assertPlaybookPdfComplete, hasPdftotext } from './playbook-print-helpers';

test.describe('Zoey go-home playbook (Premium Puppy Placement handoff)', () => {
	test('loads cover, shows key content, and navigates slides', async ({ page }) => {
		await page.goto('/zoey-go-home-playbook/');

		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		await expect(page.getByRole('heading', { level: 1, name: /Zoey/ })).toBeVisible();

		const cover = page.locator('.cover-photo');
		await expect(cover).toBeVisible();
		const naturalWidth = await cover.evaluate((img: HTMLImageElement) => img.naturalWidth);
		expect(naturalWidth).toBeGreaterThan(0);

		await page.getByRole('button', { name: /Next slide/i }).click();
		await expect(page.getByRole('heading', { level: 2, name: /Who Zoey is/i })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: /Energy and follow-through/i })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: /Car rides and motion sickness/i })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: /Daily tether time/i })).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 3' }).click();
		await expect(page.getByRole('heading', { level: 3, name: /morning rhythm/i })).toBeVisible();
		await expect(page.getByText(/alone crate time daily/i)).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 4' }).click();
		await expect(page.getByRole('heading', { level: 3, name: 'Break' })).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 5' }).click();
		await expect(page.getByRole('heading', { level: 2, name: /Training concepts/i })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: 'The staircase' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: 'The cliffhanger' })).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 6' }).click();
		await expect(page.getByRole('heading', { level: 3, name: 'Shake' })).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 7' }).click();
		await expect(page.getByRole('heading', { level: 3, name: 'Hurry Up' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: 'Come' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: 'Go to sleep' })).toBeVisible();
	});

	test('slide dots jump to closing section', async ({ page }) => {
		await page.goto('/zoey-go-home-playbook/');
		await page.getByRole('button', { name: 'Go to slide 9' }).click();
		await expect(page.getByRole('heading', { level: 2, name: /not on your own/i })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: /homework plan/i })).toBeVisible();
	});

	test('no horizontal overflow on mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/zoey-go-home-playbook/');
		const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientW = await page.evaluate(() => document.documentElement.clientWidth);
		expect(scrollW).toBeLessThanOrEqual(clientW + 1);
	});

	test('print PDF includes full handoff content', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'chromium-desktop', 'PDF checks run on desktop Chromium only');
		test.skip(!hasPdftotext(), 'pdftotext is required for PDF completeness checks');

		await page.goto('/zoey-go-home-playbook/');
		await assertPlaybookPdfComplete(page, 'zoey', [
			'The staircase',
			'The cliffhanger',
			'poops first thing in the morning',
			'alone crate time daily',
			'Car rides and motion sickness',
			'Break',
			'Shake',
			'Tether once a day',
			'Come',
			'Your homework plan',
			'Freedom, consistency, and household manners',
		]);
	});
});
