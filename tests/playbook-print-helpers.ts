import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { expect, type Page } from '@playwright/test';

export function hasPdftotext(): boolean {
	try {
		execSync('command -v pdftotext', { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

export async function assertPlaybookPdfComplete(
	page: Page,
	slug: string,
	requiredPhrases: string[],
): Promise<void> {
	const outDir = path.join('test-results');
	fs.mkdirSync(outDir, { recursive: true });
	const pdfPath = path.join(outDir, `${slug}-print-check.pdf`);

	await page.pdf({
		path: pdfPath,
		format: 'Letter',
		printBackground: true,
		preferCSSPageSize: true,
	});

	const text = execSync(`pdftotext "${pdfPath}" -`, { encoding: 'utf8' });

	for (const phrase of requiredPhrases) {
		expect(text, `PDF missing "${phrase}"`).toContain(phrase);
	}

	// Orphaned command labels mean a panel was split across pages in the 2-column layout.
	expect(text).not.toMatch(/\nMEANS\n\n(?:MEANS|\d{2}\n)/);
	expect(text).toContain('Reach out when unsure');
	expect(text).toContain('919-816-2426');
}
