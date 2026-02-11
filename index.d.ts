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
	/**
	 * Creates an instance of TrackPagesRead.
	 * @param {TrackPagesReadConfig} [config={}] Configuration object.
	 */
	constructor(config?: TrackPagesReadConfig);
	/**
	 * Set the configuration options for TrackPagesRead.
	 * @param {TrackPagesReadConfig} config Configuration object.
	 */
	setConfig(config: TrackPagesReadConfig): void;
	/**
	 * Check if a page has been read.
	 * @param {string?} pathname The pathname of the page to check. If not provided, the current pathname will be used.
	 * @returns {Promise<Date|null>} Returns the date the page was read if it has been, otherwise null.
	 */
	isRead(pathname?: string | null): Promise<Date | null>;
	/**
	 * Get all pages that have been read.
	 * @returns {AsyncGenerator<{pathname: string, date: Date}>}
	 */
	getAll(): AsyncGenerator<{
		pathname: string;
		date: Date;
	}>;
	/**
	 * Get all pages that have been read under a specific pathname.
	 * @param {string} pathname The pathname to get all pages that have been read under.
	 * @returns {AsyncGenerator<{pathname: string, date: Date}>}
	 */
	getAllByPath(pathname: string): AsyncGenerator<{
		pathname: string;
		date: Date;
	}>;
	/**
	 * Mark the current page as read.
	 * @param {string?} pathname The pathname of the page to mark as read. If not provided, the current pathname will be used.
	 * @returns {Promise<void>}
	 */
	markAsRead(pathname?: string | null): Promise<void>;
	/**
	 * Track how far the user has scrolled in the page and mark it as read if the threshold is met.
	 * @param {number} threshold The threshold to use for marking the page as read (0 - 1, default: 0.8)
	 * @param {number} frequency The max frequency of calls in milliseconds (default: 2000)
	 */
	trackScroll(threshold?: number, frequency?: number): void;
	#private;
}
/**
 * Configuration options for TrackPagesRead.
 */
export type TrackPagesReadConfig = {
	/**
	 * The IndexedDB database name (default: 'track-pages-read').
	 */
	dbName?: string;
	/**
	 * The IndexedDB database version (default: 1).
	 */
	dbVersion?: number;
	/**
	 * The IndexedDB object store name (default: 'paths').
	 */
	storeName?: string;
};
