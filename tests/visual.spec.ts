import { test, expect } from '@playwright/test';

const pages = ['home.html', 'training.html', 'Boarding.html', 'Contact_us.html', 'Videos.html'];

for (const path of pages) {
	test.describe(`${path} visual layout`, () => {
		test(`no horizontal overflow on ${path}`, async ({ page }) => {
			await page.goto(`/${path}`);
			const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
			const clientW = await page.evaluate(() => document.documentElement.clientWidth);
			expect(scrollW, 'page should not overflow horizontally').toBeLessThanOrEqual(clientW + 1);
		});

		test(`hero centered and visible on ${path}`, async ({ page }) => {
			await page.goto(`/${path}`);
			const hero = page.locator('section.hero');
			await expect(hero).toBeVisible();
			const container = page.locator('section.hero .container').first();
			await expect(container).toBeVisible();
			const paddingLeft = await container.evaluate((el) => parseFloat(getComputedStyle(el).paddingLeft));
			expect(paddingLeft).toBeGreaterThanOrEqual(16);
		});

		test(`images are not distorted on ${path}`, async ({ page }) => {
			await page.goto(`/${path}`);
			// Skip the hidden lightbox <img id="lightbox-img"> used for modal viewing
			const imgs = page.locator('img:not(#lightbox-img)');
			const count = await imgs.count();
			for (let i = 0; i < count; i++) {
				const img = imgs.nth(i);
				await expect(img).toBeVisible();
				const ok = await img.evaluate((el) => {
					const r = el.getBoundingClientRect();
					if (r.width === 0 || r.height === 0) return true;
					const ratio = r.width / r.height;
					return ratio > 0.3 && ratio < 3.5;
				});
				expect(ok, 'image aspect ratio is within a reasonable range').toBeTruthy();
			}
		});
	});
}

// Contact page specific symmetry and spacing checks
test.describe('Contact_us.html contact layout', () => {
	test('two contact cards present and aligned', async ({ page }) => {
		await page.goto('/Contact_us.html');
		const cards = page.locator('.contact-info-grid .info-card');
		await expect(cards).toHaveCount(2);
		const box1 = await cards.nth(0).boundingBox();
		const box2 = await cards.nth(1).boundingBox();
		expect(box1 && box2).toBeTruthy();
		if (box1 && box2) {
			// If cards are side-by-side, their x positions will differ significantly.
			const sideBySide = Math.abs(box1.x - box2.x) > 40;
			if (sideBySide) {
				// Similar heights (within 140px) to avoid awkward imbalance
				expect(Math.abs(box1.height - box2.height)).toBeLessThanOrEqual(140);
			}
		}
	});
});

// Mobile-specific checks
test.describe('Mobile layout checks', () => {
	test.use({ viewport: { width: 390, height: 844 } });

	test('no horizontal scroll on mobile and hero text readable', async ({ page }) => {
		await page.goto('/home.html');
		const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
		const clientW = await page.evaluate(() => document.documentElement.clientWidth);
		expect(scrollW).toBeLessThanOrEqual(clientW + 1);
		await expect(page.locator('section.hero h1').first()).toBeVisible();
	});

	test('home hero stacks poster above text on mobile', async ({ page }) => {
		await page.goto('/home.html');
		const container = page.locator('section.hero .container');
		await expect(container).toBeVisible();
		const children = container.locator('> div');
		await expect(children).toHaveCount(2);
		const firstHasImg = await children.nth(0).locator('img').count();
		const secondHasImg = await children.nth(1).locator('img').count();
		const posterIdx = firstHasImg > 0 ? 0 : 1;
		const copyIdx = posterIdx === 0 ? 1 : 0;
		const posterBox = await children.nth(posterIdx).boundingBox();
		const copyBox = await children.nth(copyIdx).boundingBox();
		expect(posterBox && copyBox).toBeTruthy();
		if (posterBox && copyBox) {
			expect(posterBox.y).toBeLessThan(copyBox.y - 10);
		}
		await expect(children.nth(posterIdx).locator('img')).toBeVisible();
	});

	test('about hero stacks poster above text on mobile', async ({ page }) => {
		await page.goto('/About_us.html');
		const container = page.locator('section.hero .container');
		await expect(container).toBeVisible();
		const children = container.locator('> div');
		await expect(children).toHaveCount(2);
		const firstHasImg = await children.nth(0).locator('img').count();
		const posterIdx = firstHasImg > 0 ? 0 : 1;
		const copyIdx = posterIdx === 0 ? 1 : 0;
		const posterBox = await children.nth(posterIdx).boundingBox();
		const copyBox = await children.nth(copyIdx).boundingBox();
		expect(posterBox && copyBox).toBeTruthy();
		if (posterBox && copyBox) {
			expect(posterBox.y).toBeLessThan(copyBox.y - 10);
		}
		await expect(children.nth(posterIdx).locator('img')).toBeVisible();
	});

	test('training hero stacks poster above text on mobile', async ({ page }) => {
		await page.goto('/training.html');
		const container = page.locator('section.hero .container');
		await expect(container).toBeVisible();
		const children = container.locator('> div');
		await expect(children).toHaveCount(2);
		const firstHasImg = await children.nth(0).locator('img').count();
		const secondHasImg = await children.nth(1).locator('img').count();
		const posterIdx = firstHasImg > 0 ? 0 : 1;
		const copyIdx = posterIdx === 0 ? 1 : 0;
		const posterBox = await children.nth(posterIdx).boundingBox();
		const copyBox = await children.nth(copyIdx).boundingBox();
		expect(posterBox && copyBox).toBeTruthy();
		if (posterBox && copyBox) {
			// Stacked vertically: poster element should be above copy
			expect(posterBox.y).toBeLessThan(copyBox.y - 10);
		}
		await expect(children.nth(posterIdx).locator('img')).toBeVisible();
	});

	test('TTP section stacks poster above copy on mobile', async ({ page }) => {
		await page.goto('/training.html#ttp');
		const section = page.locator('#ttp .container');
		await expect(section).toBeVisible();
		const kids = section.locator('> div');
		await expect(kids).toHaveCount(2);
		const box0 = await kids.nth(0).boundingBox();
		const box1 = await kids.nth(1).boundingBox();
		expect(box0 && box1).toBeTruthy();
		if (box0 && box1) {
			// On mobile, grid becomes single column via CSS .split, so first child (image wrapper) above second (copy)
			expect(box0.y).toBeLessThan(box1.y - 10);
		}
		await expect(kids.nth(0).locator('img')).toBeVisible();
	});
});
