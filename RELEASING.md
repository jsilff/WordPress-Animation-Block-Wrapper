# Release Workflow (GitHub -> WordPress.org SVN)

## Version sync rules

Before each release:

- Update `animation-wrapper.php` plugin header `Version`.
- Update `block.json` `version`.
- Update `build/index.asset.php` and `build/view.asset.php` versions.
- Set matching `Stable tag` in `readme.txt`.
- Add release notes in `CHANGELOG.md` and `readme.txt` changelog section.

## Pre-submit checks

1. Validate `readme.txt` with the official WordPress readme validator.
2. Run plugin lint/security checks (PHP lint, WordPress coding standards, security review pass).
3. Confirm no tracking/telemetry or remote asset dependencies without explicit user opt-in.

## WordPress.org SVN layout

- `trunk/`: latest development-ready stable code.
- `tags/x.y.z/`: exact release snapshots.
- `assets/`: plugin page media (`icon-*`, `banner-*`, `screenshot-*`).

## Suggested release steps

1. Merge to `main` and tag `vX.Y.Z` in GitHub.
2. Export plugin files (excluding `.distignore` entries) to SVN `trunk/`.
3. Copy same files to SVN `tags/X.Y.Z/`.
4. Commit/update `assets/` files as needed.
5. Verify plugin page metadata, screenshots, and download version after SVN propagation.
