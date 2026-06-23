import { expect, test } from '@playwright/test';

test.describe('persist middleware test pages', () => {
	test.beforeEach(async ({ context }) => {
		await context.clearCookies();
	});

	test('persists state in localStorage', async ({ page }) => {
		await page.goto('/test-localstorage');
		await page.waitForLoadState('networkidle');
		await page.evaluate(() => localStorage.removeItem('stored-localstorage-test'));
		await page.reload();
		await page.waitForLoadState('networkidle');

		await expect(page.getByTestId('count')).toHaveText('0');
		await page.getByRole('button', { name: 'Increment' }).click();
		await expect(page.getByTestId('count')).toHaveText('1');

		await page.reload();
		await page.waitForLoadState('networkidle');

		await expect(page.getByTestId('count')).toHaveText('1');
		await expect(
			page.evaluate(() => localStorage.getItem('stored-localstorage-test'))
		).resolves.toBe('{"count":1}');
	});

	test('persists state in custom cookie storage', async ({ page }) => {
		await page.goto('/test-cookie');
		await page.context().clearCookies();
		await page.reload();
		await page.waitForLoadState('networkidle');

		await expect(page.getByTestId('count')).toHaveText('0');
		await page.getByRole('button', { name: 'Increment' }).click();
		await expect(page.getByTestId('count')).toHaveText('1');

		await page.reload();
		await page.waitForLoadState('networkidle');

		await expect(page.getByTestId('count')).toHaveText('1');

		const cookies = await page.context().cookies();
		const persistedCookie = cookies.find((cookie) => cookie.name === 'stored-cookie-test')?.value;

		expect(persistedCookie ? decodeURIComponent(persistedCookie) : undefined).toBe('{"count":1}');
	});
});
