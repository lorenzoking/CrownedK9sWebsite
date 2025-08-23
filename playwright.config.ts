import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	// Run against a simple static server so relative links work
	webServer: {
		command: 'npx http-server -p 4173 . -c-1',
		port: 4173,
		reuseExistingServer: true,
		timeout: 30_000,
	},
	use: {
		baseURL: 'http://localhost:4173',
		headless: true,
		actionTimeout: 15_000,
		navigationTimeout: 20_000,
	},
	projects: [
		{ name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
		{ name: 'chromium-tablet', use: { ...devices['iPad Air'] } },
		{ name: 'chromium-mobile', use: { ...devices['iPhone 12'] } },
	],
});
