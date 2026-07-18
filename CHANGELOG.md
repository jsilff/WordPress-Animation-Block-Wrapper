# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

- Added derived exit styles from entrance presets — no separate exit catalog.
- Replaced exit-style config with **Animate In / Out / In & Out** (hidden for Scrub, loop presets, load, and loop trigger).
- When **Animate In & Out** is selected, **Exit direction** offers Reverse or Continue (derived from the same preset).
- Exit now plays on hover leave, click toggle off, and scroll leave when mode includes Out.
- Text exits reverse their stagger order (last unit leaves first).
- Default missing `data-ffaw-once` to play-once (true), matching the React port — avoids viewport-edge hide/animate flicker.
- Skip exit when entrance is still delayed; queue exit until entrance fully finishes (no interrupted cycles).
- Always re-prime the initial invisible state after skip/exit when the entrance starts hidden.
- Prime hover (starts-hidden) invisible state on load — not only after the first mouse interaction.
- Nested wrappers: clearer **Match parent timing** vs **Join parent animation** controls.
- Fix nested-only parents (e.g. Rise wrapping Hover) getting zero targets so the outer effect never fired.
- Hide-until-hover no longer forces nested wrappers hidden unless they join the parent animation (keeps independent Scrub visible).
- Added automated jsdom scenario tests for nesting targets, hover visibility, delay inheritance, animation modes, and exit gating (`npm test`).

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
