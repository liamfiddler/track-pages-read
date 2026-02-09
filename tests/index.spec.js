import { test, expect } from '@playwright/test';

test.describe('TrackPagesRead', () => {
	test.beforeEach(async ({ page }) => {
		// Navigate to the test page
		await page.goto('/tests/index.html');

		// Clear IndexedDB before each test
		await page.evaluate(async () => {
			const databases = await indexedDB.databases();
			for (const db of databases) {
				indexedDB.deleteDatabase(db.name);
			}
		});
	});

	test('should mark a page as read', async ({ page }) => {
		// Mark the current page as read
		await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');
			const tracker = new TrackPagesRead();
			await tracker.markAsRead('/test-page');
		});

		// Verify the page was marked as read
		const result = await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');
			const tracker = new TrackPagesRead();
			const date = await tracker.isRead('/test-page');
			return date !== null;
		});

		expect(result).toBe(true);
	});

	test('should return null for unread pages', async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');
			const tracker = new TrackPagesRead();
			const date = await tracker.isRead('/non-existent-page');
			return date;
		});

		expect(result).toBeNull();
	});

	test('should return a Date object for read pages', async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');
			const tracker = new TrackPagesRead();

			// Mark a page as read
			await tracker.markAsRead('/test-page');

			// Check if it was read
			const date = await tracker.isRead('/test-page');

			return {
				isDate: date instanceof Date,
				isRecent: date && Date.now() - date.getTime() < 5000, // Within 5 seconds
			};
		});

		expect(result.isDate).toBe(true);
		expect(result.isRecent).toBe(true);
	});

	test('should get all read pages', async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');
			const tracker = new TrackPagesRead();

			// Mark multiple pages as read
			await tracker.markAsRead('/page-1');
			await tracker.markAsRead('/page-2');
			await tracker.markAsRead('/page-3');

			// Get all pages
			const pages = [];
			for await (const p of tracker.getAll()) {
				pages.push(p);
			}

			return {
				count: pages.length,
				pathnames: pages.map((p) => p.pathname).sort(),
				allHaveDates: pages.every((p) => p.date instanceof Date),
			};
		});

		expect(result.count).toBe(3);
		expect(result.pathnames).toEqual(['/page-1', '/page-2', '/page-3']);
		expect(result.allHaveDates).toBe(true);
	});

	test('should return empty array when no pages are read', async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');
			const tracker = new TrackPagesRead();
			const pages = [];
			for await (const p of tracker.getAll()) {
				pages.push(p);
			}
			return pages.length;
		});

		expect(result).toBe(0);
	});

	test('should get pages by path prefix using getAllByPath', async ({
		page,
	}) => {
		const result = await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');
			const tracker = new TrackPagesRead();

			// Mark pages with different paths
			await tracker.markAsRead('/blog/post-1');
			await tracker.markAsRead('/blog/post-2');
			await tracker.markAsRead('/blog/post-3');
			await tracker.markAsRead('/about');
			await tracker.markAsRead('/contact');

			// Get only blog pages
			const blogPages = [];
			for await (const page of tracker.getAllByPath('/blog')) {
				blogPages.push(page);
			}

			return {
				count: blogPages.length,
				allHaveDates: blogPages.every((p) => p.date instanceof Date),
			};
		});

		expect(result.count).toBe(3);
		expect(result.allHaveDates).toBe(true);
	});

	test('should work with custom configuration', async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');

			// Create tracker with custom config
			const tracker = new TrackPagesRead({
				dbName: 'custom-test-db',
				dbVersion: 1,
				storeName: 'custom-store',
				debounceTime: 2000,
			});

			// Mark a page as read
			await tracker.markAsRead('/custom-test');

			// Verify it was saved
			const date = await tracker.isRead('/custom-test');

			return {
				wasRead: date !== null,
				isDate: date instanceof Date,
			};
		});

		expect(result.wasRead).toBe(true);
		expect(result.isDate).toBe(true);

		// Verify the custom database was created
		const dbExists = await page.evaluate(async () => {
			const databases = await indexedDB.databases();
			return databases.some((db) => db.name === 'custom-test-db');
		});

		expect(dbExists).toBe(true);
	});

	test('should update existing page read timestamp', async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');
			const tracker = new TrackPagesRead();

			// Mark a page as read
			await tracker.markAsRead('/test-page');
			const firstDate = await tracker.isRead('/test-page');

			// Wait a bit
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Mark the same page as read again
			await tracker.markAsRead('/test-page');
			const secondDate = await tracker.isRead('/test-page');

			return {
				firstTime: firstDate.getTime(),
				secondTime: secondDate.getTime(),
				wasUpdated: secondDate.getTime() > firstDate.getTime(),
			};
		});

		expect(result.wasUpdated).toBe(true);
	});

	test('should handle special characters in pathnames', async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');
			const tracker = new TrackPagesRead();

			const specialPaths = [
				'/page-with-dash',
				'/page_with_underscore',
				'/page with spaces',
				'/page?query=param',
				'/page#hash',
			];

			// Mark all special paths as read
			for (const path of specialPaths) {
				await tracker.markAsRead(path);
			}

			// Verify all were saved
			const results = await Promise.all(
				specialPaths.map((path) => tracker.isRead(path))
			);

			return results.every((date) => date !== null);
		});

		expect(result).toBe(true);
	});

	test('should use window.location.pathname when no pathname is provided', async ({
		page,
	}) => {
		// Navigate to a specific path
		await page.goto('/tests/index.html');

		const result = await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');
			const tracker = new TrackPagesRead();

			// Mark current page (should use window.location.pathname)
			await tracker.markAsRead();

			// Check if current page was marked
			const date = await tracker.isRead();

			return {
				pathname: window.location.pathname,
				wasMarked: date !== null,
			};
		});

		expect(result.wasMarked).toBe(true);
		expect(result.pathname).toBe('/tests/index.html');
	});

	test('should handle concurrent operations', async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');
			const tracker = new TrackPagesRead();

			// Mark multiple pages concurrently
			await Promise.all([
				tracker.markAsRead('/concurrent-1'),
				tracker.markAsRead('/concurrent-2'),
				tracker.markAsRead('/concurrent-3'),
				tracker.markAsRead('/concurrent-4'),
				tracker.markAsRead('/concurrent-5'),
			]);

			// Get all pages
			const pages = [];
			for await (const p of tracker.getAll()) {
				pages.push(p);
			}

			return pages.length;
		});

		expect(result).toBe(5);
	});

	test('should persist data across instances', async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');

			// Create first instance and mark a page
			const tracker1 = new TrackPagesRead();
			await tracker1.markAsRead('/persistent-page');

			// Create second instance and check if page is read
			const tracker2 = new TrackPagesRead();
			const date = await tracker2.isRead('/persistent-page');

			return date !== null;
		});

		expect(result).toBe(true);
	});

	test('should allow reconfiguration with setConfig', async ({ page }) => {
		const result = await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');

			// Create tracker with default config
			const tracker = new TrackPagesRead();
			await tracker.markAsRead('/default-db-page');

			// Reconfigure to use a different database (but same store name to avoid upgrade issues)
			tracker.setConfig({
				dbName: 'reconfigured-db',
				storeName: 'paths', // Keep same store name
				debounceTime: 1000,
			});

			// Mark a page in the new database
			await tracker.markAsRead('/reconfigured-page');

			// Check if the page exists in the new database
			const date = await tracker.isRead('/reconfigured-page');

			return date !== null;
		});

		expect(result).toBe(true);
	});

	test('should mark page as read when scrolling past threshold', async ({
		page,
	}) => {
		const result = await page.evaluate(async () => {
			const { default: TrackPagesRead } = await import('../index.js');
			const tracker = new TrackPagesRead({ debounceTime: 100 });

			// Start tracking with 75% threshold and a 50ms throttle
			tracker.trackScroll(0.75, 10);

			// Verify it's not read initially
			const initiallyRead = await tracker.isRead();
			if (initiallyRead !== null)
				return { error: 'Should not be read initially' };

			// Scroll to the bottom
			window.scrollTo(0, document.body.scrollHeight);

			// Wait for IntersectionObserver and throttle (IntersectionObserver is async)
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Verify it's now marked as read
			const finallyRead = await tracker.isRead();

			return {
				initiallyRead: initiallyRead !== null,
				finallyRead: finallyRead !== null,
			};
		});

		expect(result.initiallyRead).toBe(false);
		expect(result.finallyRead).toBe(true);
	});
});
