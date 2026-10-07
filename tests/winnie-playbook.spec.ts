import { test, expect } from '@playwright/test';
import { assertPlaybookPdfComplete, hasPdftotext } from './playbook-print-helpers';

test.describe('Winnie go-home playbook (Find My Puppy Academy handoff)', () => {
	test('loads cover, shows key content, and navigates slides', async ({ page }) => {
		await page.goto('/winnie-go-home-playbook/');

		await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
		await expect(page.getByRole('heading', { level: 1, name: /Winnie/ })).toBeVisible();

		const cover = page.locator('.cover-photo');
		await expect(cover).toBeVisible();
		const naturalWidth = await cover.evaluate((img: HTMLImageElement) => img.naturalWidth);
		expect(naturalWidth).toBeGreaterThan(0);

		await page.getByRole('button', { name: /Next slide/i }).click();
		await expect(page.getByRole('heading', { level: 2, name: /Who Winnie is/i })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: 'Motivation' })).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 3' }).click();
		await expect(page.getByRole('heading', { level: 3, name: /potty rhythm/i })).toBeVisible();
		await expect(page.getByText(/whine in the crate when she needs to potty/i)).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 4' }).click();
		await expect(page.getByRole('heading', { level: 3, name: 'Break' })).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 5' }).click();
		await expect(page.getByRole('heading', { level: 3, name: 'The staircase' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: 'The cliffhanger' })).toBeVisible();

		await page.getByRole('button', { name: 'Go to slide 7' }).click();
		await expect(page.getByRole('heading', { level: 3, name: 'Come (kissy sounds)' })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: 'Leash pressure' })).toBeVisible();
	});

	test('slide dots jump to closing section', async ({ page }) => {
		await page.goto('/winnie-go-home-playbook/');
		await page.getByRole('button', { name: 'Go to slide 9' }).click();
		await expect(page.getByRole('heading', { level: 2, name: /not on your own/i })).toBeVisible();
		await expect(page.getByRole('heading', { level: 3, name: /homework plan/i })).toBeVisible();
	});

	test('no horizontal overflow on mobile viewport', async ({ page }) => {
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/winnie-go-home-playbook/');
		const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientW = await page.evaluate(() => document.documentElement.clientWidth);
		expect(scrollW).toBeLessThanOrEqual(clientW + 1);
	});

	test('print PDF includes full handoff content', async ({ page }, testInfo) => {
		test.skip(testInfo.project.name !== 'chromium-desktop', 'PDF checks run on desktop Chromium only');
		test.skip(!hasPdftotext(), 'pdftotext is required for PDF completeness checks');

		await page.goto('/winnie-go-home-playbook/');
		await assertPlaybookPdfComplete(page, 'winnie', [
			'loves to cuddle',
			'poops right after she eats',
			'Limit her water intake',
			'whine in the crate',
			'The staircase',
			'The cliffhanger',
			'Come (kissy sounds)',
			'Leash pressure',
			'tethering her once a day',
			'Your homework plan',
			'Play, cuddles, and household manners',
		]);
	});
});
