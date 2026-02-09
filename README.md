# Track Pages Read

A small utility to track pages read by a user.

## Installation

```bash
npm install liamfiddler/track-pages-read
```

## Usage

```javascript
import TrackPagesRead from 'track-pages-read';

const tracker = new TrackPagesRead();

// Mark a page as read
await tracker.markAsRead('/my-page');

// Check if a page was read
const date = await tracker.isRead('/my-page');

// Get all pages
const pages = await tracker.getAll();
```
