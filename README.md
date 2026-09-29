# AniLibrary

MIT-licensed Gutenberg wrapper block plugin for lightweight, content-aware animations.

See `readme.txt` for WordPress.org-ready documentation.

## 1.3.2

Per-character animations compensate for kerning between letter spans, so words no longer shift when the split text is restored.

## 1.3.1

Entrance animations stay invisible until they start, including staggered text. Reduced motion shows content immediately. Invalid viewport margins no longer hide a block or stop the rest of the page. The front-end script loads once.

## 1.3.0

Ports React AniLibrary shared-runtime parity: Safari blur settle, join-parent early-return, scroll IO thresholds + viewport margin, `abw-pending` no-flash, and layout/item stagger (`abw-stagger-item`).
