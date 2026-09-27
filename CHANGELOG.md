# Changelog

All notable changes to this project will be documented in this file.

## 1.3.1 - 2026-09-27

- Entrance presets (Rise, Blur, Fade, Slide, and the rest) hold the invisible from-frame through stagger and delay (`fill: both`); primed inline styles are cleared only after the effect exists.
- Reduced motion overrides `abw-pending` and hide-until-hover so content is visible before JavaScript runs.
- Invalid viewport margin or threshold no longer throws inside `IntersectionObserver` (which left that block hidden and skipped every wrapper after it). One failed wrapper is revealed and does not stop the others.
- Non-numeric duration, delay, and stagger fall back instead of being passed to WAAPI.
- Canceled text entrances no longer restore the original visible markup. Text Bounce waits for every iteration before un-splitting.
- Register editor, style, and view assets by handle so `view.js` is not printed twice and the editor bundle is not stuck on the 1.2.0 asset version.

## 1.3.0 - 2026-08-04

- Confirmed compatibility with WordPress 7.1.
- Safari / WebKit: after entrance completes, settle WAAPI with `commitStyles`, cancel, and bounce `filter` so mid-flight blur layers do not stick; exit gating trusts `abwEntranceCompleted` after settle.
- Join parent animation children no longer attach their own scroll/hover/click/loop triggers (prime only).
- Scroll IntersectionObserver now uses threshold `[0, t, 1]` and optional **Viewport margin** (`rootMargin` / `data-ffaw-root-margin`).
- No-flash `abw-pending` class on save when entrance starts hidden; runtime clears it after priming.
- Layout / item stagger: non-text wrappers can stagger children; selective targets via CSS class `abw-stagger-item` (or `data-ffaw-stagger-item="1"`).

## 1.2.0 - 2026-07-18

- Added derived exit styles from entrance presets — no separate exit catalog.
- **Animate In / Out / In & Out** (hidden for Scrub, loop presets, load, and loop trigger).
- When **Animate In & Out** is selected, **Exit direction** offers Reverse or Continue (derived from the same preset).
- Exit now plays on hover leave, click toggle off, and scroll leave when mode includes Out.
- Text exits reverse their stagger order (last unit leaves first).
- Default missing `data-ffaw-once` to play-once (true) — avoids viewport-edge hide/animate flicker.
- Skip exit when entrance is still delayed; queue exit until entrance fully finishes (no interrupted cycles).
- Always re-prime the initial invisible state after skip/exit when the entrance starts hidden.
- Prime hover (starts-hidden) invisible state on load when **Hide until hover** is enabled — not only after the first mouse interaction.
- Nested wrappers: clearer **Match parent timing** vs **Join parent animation** controls.
- Fix nested-only parents (e.g. Rise wrapping Hover) getting zero targets so the outer effect never fired.
- Hide-until-hover no longer forces nested wrappers hidden unless they join the parent animation (keeps independent Scrub visible).
- Serialize `animation-mode="in"` when scroll replay / click toggle would otherwise be inferred as legacy `both`.
- Keep observing out-only scroll wrappers after above-the-fold manual entry so exit can still fire.
- Ignore canceled / superseded exit completions before re-hiding hover content.
- Added automated jsdom scenario tests for nesting targets, hover visibility, delay inheritance, animation modes, and exit gating (`npm test`).
- Expanded nested scenario coverage: target matrix, inherit-delay stacks, hide-until-hover arming, parent-replay cascading, and config smoke combos.
- Animation Settings panel now opens by default in the editor sidebar.
- Added **Remove animation & keep content** to unwrap inner blocks without manually moving them out first (also registers Ungroup).

## 1.1.0 - 2026-06-03

- Added a media-only Scrub preset for video blocks.
- Added media controls for scroll direction, one-way playback, and screen/page/parent scroll ranges.
- Added animated GIF support with graceful fallback when a browser cannot step through the GIF.
- Added an option for top-of-page, fixed, or sticky media to start at the beginning.
- Added a Scrub cycle control to repeat media playback as users scroll.

## 1.0.0 - 2026-05-17

- Added the AniLibrary Gutenberg block.
- Added content-aware animation preset filtering and recommendations.
- Added CSS + WAAPI runtime with load, scroll, hover, click, and loop triggers.
- Added WordPress.org submission-ready metadata and asset file structure.
