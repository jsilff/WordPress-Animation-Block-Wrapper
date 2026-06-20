# WordPress.org directory files

This directory holds files intended for the WordPress.org plugin directory, not
the plugin code itself. The whole directory is excluded from the distribution
zip via `.distignore`, so nothing here ships inside the plugin.

## `assets/`

Banners, icons, and the screenshot for the plugin directory page. These use the
exact filenames WordPress.org recognizes and are uploaded separately to the SVN
repository's `/assets/` folder after the plugin is approved:

- `icon-256x256.png`, `icon-128x128.png`, `icon.svg`
- `banner-1544x500.png`, `banner-772x250.png`
- `screenshot-1.png`

See [How Your Plugin Assets Work](https://developer.wordpress.org/plugins/wordpress-org/plugin-assets/).

## `block-icon.svg`

Local design source only. It is NOT a filename WordPress.org recognizes, so it is
not uploaded via SVN and is not used by the plugin code (the block uses the
`format-image` dashicon and an inline SVG). Kept here just as a design reference.
