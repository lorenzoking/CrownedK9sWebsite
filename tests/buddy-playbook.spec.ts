import { test, expect } from '@playwright/test';
import { assertPlaybookPdfComplete, hasPdftotext } from './playbook-print-helpers';

test.describe('Buddy go-home playbook (Premium Puppy Placement handoff)', () => {
	test('loads cover, shows key content, and navigates slides', async ({ page }) => {
		await page.goto('/buddy-go-home-playbook/');

		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		await expect(page.getByRole('heading', { level: 1, name: /Buddy/ })).toBeVisible();

		const cover = page.locator('.cover-photo');
		await expect(cover).toBeVisible();
		const naturalWidth = await cover.evaluate((img: HTMLImageElement) => img.naturalWidth);
		expect(naturalWidth).toBeGreaterThan(0);

		await page.getByRole('button', { name: /Next slide/i }).click();
		await expect(page.getByRole('heading', { level: 2, name: /Meet Buddy/i })).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 4' }).click();
		await expect(page.getByRole('heading', { level: 2, name: /nighttime potty plan/i })).toBeVisible();
		await expect(page.getByText(/2\s*AM to 6\s*AM/i)).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 6' }).click();
		await expect(page.getByRole('heading', { level: 3, name: 'Break' })).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 8' }).click();
		await expect(page.getByRole('heading', { level: 3, name: 'Stay', exact: true })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: /CHT sound/i })).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 9' }).click();
		await expect(page.getByRole('heading', { level: 2, name: /biggest homework/i })).toBeVisible();
	});

	test('slide dots jump to closing section', async ({ page }) => {
		await page.goto('/buddy-go-home-playbook/');
		await page.getByRole('button', { name: 'Go to slide 10' }).click();
		await expect(page.getByRole('heading', { level: 2, name: /House rules/i })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: /First-week checklist/i })).toBeVisible();
	});

	test('no horizontal overflow on mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/buddy-go-home-playbook/');
		const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientW = await page.evaluate(() => document.documentElement.clientWidth);
		expect(scrollW).toBeLessThanOrEqual(clientW + 1);
	});

	test('print PDF includes full handoff content', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'chromium-desktop', 'PDF checks run on desktop Chromium only');
		test.skip(!hasPdftotext(), 'pdftotext is required for PDF completeness checks');

		await page.goto('/buddy-go-home-playbook/');
		await assertPlaybookPdfComplete(page, 'buddy', [
			'Hurry Up',
			'four potty triggers',
			'nighttime potty plan',
			'Sample daily routine',
			'Break',
			'CHT sound',
			'biggest homework',
			'First-week checklist',
			'Lead with Confidence',
		]);
	});
});
