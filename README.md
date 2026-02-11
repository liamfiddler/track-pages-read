# 📖 Track Pages Read

> _A lightweight, persistent, and high-performance utility to track page views and reading progress._

🚀 **Fast** | 📦 **Lightweight** (uses `idb`) | 💾 **Persistent** (IndexedDB)

## ✨ Features

- 🚀 **Performance First** - Uses [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) via the `idb` library for non-blocking, persistent storage.
- 📜 **Auto-Tracking** - Automatically detect when a user has "read" a page by tracking scroll depth.
- ⏱️ **Robust Throttling** - High-performance scroll listeners with built-in throttling (including trailing-edge support).
- 🔄 **Async Generators** - Efficiently iterate through your reading history without loading everything into memory.
- 🛠️ **Customizable** - Configure database names, store names, and tracking sensitivity to fit your needs.

## 📦 Installation

```bash
npm install --save liamfiddler/track-pages-read
```

## 🚀 Quick Start

### Basic Setup

Initialize the tracker and start monitoring reading progress automatically.

```javascript
import TrackPagesRead from 'track-pages-read';

const tracker = new TrackPagesRead();

// 🎯 Automatically mark pages as read when the user scrolls 80% down
tracker.trackScroll();

// ✅ Check if the current page has already been read
const readDate = await tracker.isRead();
if (readDate) {
	console.log(`Page read on: ${readDate.toLocaleString()}`);
}
```

## ⚙️ Advanced Configuration

You can customize the underlying storage and tracking frequency:

```javascript
const tracker = new TrackPagesRead({
	dbName: 'analytics-db', // Name of the IndexedDB database
	dbVersion: 1, // Database version
	storeName: 'viewed_paths', // Object store name
});

// Fine-tuned scroll tracking
tracker.trackScroll(
	0.75, // Threshold: 75% of page height
	1000 // Frequency: Max one update every 1000ms
);
```

## 📖 API Reference

### `constructor(config?: TrackPagesReadConfig)`

Creates a new instance.

- `dbName` (default: `'track-pages-read'`)
- `dbVersion` (default: `1`)
- `storeName` (default: `'paths'`)

### `isRead(pathname?: string): Promise<Date|null>`

Checks if a page has been read. If `pathname` is omitted, uses `window.location.pathname`.

### `getAll(): AsyncGenerator<{pathname: string, date: Date}>`

Yields every read page in the database.

### `getAllByPath(pathname: string): AsyncGenerator<{pathname: string, date: Date}>`

Efficiently retrieves all pages under a specific path prefix (e.g., `/blog`).

### `markAsRead(pathname?: string): Promise<void>`

Manually marks a page as read.

### `trackScroll(threshold?: number, frequency?: number): void`

Starts a scroll listener.

- `threshold` (default: `0.8`): Depth ratio (0-1) to trigger "read" status.
- `frequency` (default: `2000`): Max update rate in milliseconds.
