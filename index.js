// @ts-check

import { openDB } from 'idb';

/**
 * @module track-pages-read
 */

/**
 * Configuration options for TrackPagesRead.
 * @typedef {Object} TrackPagesReadConfig
 * @property {string} [dbName] The IndexedDB database name (default: 'track-pages-read').
 * @property {number} [dbVersion] The IndexedDB database version (default: 1).
 * @property {string} [storeName] The IndexedDB object store name (default: 'paths').
 */

/**
 * A class that tracks pages read by a user.
 */
export default class TrackPagesRead {
	/** @type {string} */
	#dbName = 'track-pages-read';

	/** @type {number} */
	#dbVersion = 1;

	/** @type {string} */
	#storeName = 'paths';

	/** @type {Promise<import('idb').IDBPDatabase>|null} */
	#db = null;

	/**
	 * Creates an instance of TrackPagesRead.
	 * @param {TrackPagesReadConfig} [config={}] Configuration object.
	 */
	constructor(config = {}) {
		this.setConfig(config);
	}

	/**
	 * Set the configuration options for TrackPagesRead.
	 * @param {TrackPagesReadConfig} config Configuration object.
	 */
	setConfig(config) {
		this.#dbName = config.dbName || this.#dbName;
		this.#dbVersion = config.dbVersion || this.#dbVersion;
		this.#storeName = config.storeName || this.#storeName;
	}

	/**
	 * Open the IndexedDB database.
	 * @returns {Promise<import('idb').IDBPDatabase>}
	 */
	#openDB() {
		if (!this.#db) {
			this.#db = openDB(this.#dbName, this.#dbVersion, {
				upgrade: (db) => {
					if (!db.objectStoreNames.contains(this.#storeName)) {
						db.createObjectStore(this.#storeName);
					}
				},
			});
		}

		return this.#db;
	}

	/**
	 * Check if a page has been read.
	 * @param {string?} pathname The pathname of the page to check. If not provided, the current pathname will be used.
	 * @returns {Promise<Date|null>} Returns the date the page was read if it has been, otherwise null.
	 */
	async isRead(pathname = null) {
		const db = await this.#openDB();
		const result = await db.get(
			this.#storeName,
			pathname ?? window.location.pathname
		);
		return result ? new Date(result) : null;
	}

	/**
	 * Get all pages that have been read.
	 * @returns {AsyncGenerator<{pathname: string, date: Date}>}
	 */
	async *getAll() {
		const db = await this.#openDB();
		const tx = db.transaction(this.#storeName, 'readonly');
		const store = tx.objectStore(this.#storeName);

		let cursor = await store.openCursor();
		while (cursor !== null) {
			yield { pathname: cursor.key, date: new Date(cursor.value) };
			cursor = await cursor.continue();
		}
	}

	/**
	 * Get all pages that have been read under a specific pathname.
	 * @param {string} pathname The pathname to get all pages that have been read under.
	 * @returns {AsyncGenerator<{pathname: string, date: Date}>}
	 */
	async *getAllByPath(pathname) {
		const range = IDBKeyRange.bound(pathname, pathname + '\uffff');
		const db = await this.#openDB();
		const tx = db.transaction(this.#storeName, 'readonly');
		const store = tx.objectStore(this.#storeName);
		let cursor = await store.openCursor(range);

		while (cursor !== null) {
			yield { pathname: cursor.key, date: new Date(cursor.value) };
			cursor = await cursor.continue();
		}
	}

	/**
	 * Mark the current page as read.
	 * @param {string?} pathname The pathname of the page to mark as read. If not provided, the current pathname will be used.
	 * @returns {Promise<void>}
	 */
	async markAsRead(pathname = null) {
		const key = pathname ?? window.location.pathname;
		const value = Date.now();
		const db = await this.#openDB();
		await db.put(this.#storeName, value, key);
	}

	/**
	 * Track how far the user has scrolled in the page and mark it as read if the threshold is met.
	 * @param {number} threshold The threshold to use for marking the page as read (0 - 1, default: 0.8)
	 * @param {number} frequency The max frequency of calls in milliseconds (default: 2000)
	 */
	trackScroll(threshold = 0.8, frequency = 2000) {
		window.addEventListener(
			'scroll',
			this.#throttle(() => {
				const scrollPct =
					(window.scrollY + window.innerHeight) /
					document.documentElement.scrollHeight;

				if (scrollPct >= threshold) {
					this.markAsRead();
				}
			}, frequency),
			{ passive: true }
		);
	}

	/**
	 * Throttle function to limit the frequency of function calls, including a trailing call.
	 * @param {(...args: any[]) => void} func The function to throttle.
	 * @param {number} limit The time limit in milliseconds.
	 * @returns {(...args: any[]) => void}
	 */
	#throttle(func, limit) {
		/** @type {number} */
		let lastCall = 0;

		/** @type {ReturnType<typeof setTimeout>|null} */
		let timeout = null;

		return (...args) => {
			const now = Date.now();
			const remaining = limit - (now - lastCall);

			if (remaining <= 0) {
				if (timeout) {
					clearTimeout(timeout);
					timeout = null;
				}
				lastCall = now;
				func.apply(this, args);
			} else if (!timeout) {
				timeout = setTimeout(() => {
					lastCall = Date.now();
					timeout = null;
					func.apply(this, args);
				}, remaining);
			}
		};
	}
}
