=== AniLibrary ===
Contributors: fearlessfuture
Tags: gutenberg, block, animation, scroll, motion
Requires at least: 6.5
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Add easy animations to any block in the WordPress editor.

== Description ==

AniLibrary gives you one wrapper block that can hold almost any other block. Add the wrapper, drop your content inside, choose an animation, and you're done.

Features:

* Works with core blocks, groups, columns, and most custom blocks.
* Choose when animations start: page load, scroll into view, hover, click, or loop.
* Use the Scrub media preset to move through a video or GIF as someone scrolls.
* GIFs can move in steps; videos give the smoothest result.
* Start top-of-page scrub media at the beginning when the page first loads.
* Repeat scrubbed media playback across a scroll range for multiple visible cycles.
* Suggests animation styles based on the content inside.
* Respects users who prefer reduced motion.
* Lightweight front-end output.
* No tracking and no outside asset requests.

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/anilibrary`, or install through the WordPress plugins screen.
2. Activate the plugin through the "Plugins" screen in WordPress.
3. Open the block editor and add "AniLibrary".
4. Place one or more blocks inside the wrapper and configure animation settings in the sidebar.

== Frequently Asked Questions ==

= Will this work with my blocks? =

Usually yes. The wrapper can contain core blocks and most custom blocks.

= Can I nest AniLibrary blocks? =

Yes. Nesting gives you more control over different parts of your content.

= Does it load scripts on every page? =

No. Front-end assets only load on pages where AniLibrary is used.

= What if a visitor prefers reduced motion? =

AniLibrary automatically reduces motion for those users.

== Screenshots ==

1. AniLibrary styles and settings in the editor sidebar.

== Changelog ==

= 1.1.0 =
* Added the Scrub media preset for videos and animated GIFs.
* Added controls for forward/backward scroll playback, one-way scroll, and once-only locking.
* Added screen, page, and parent block scroll sources for fixed and nested media layouts.
* Added beginning-at-page-top behavior for hero, fixed, and sticky media.
* Added a playback cycles control for repeating scrubbed media as users scroll.
* Added animated GIF support with graceful fallback when a browser cannot step through the GIF.

= 1.0.0 =
* Initial release.
* Added wrapper block with load/scroll/hover/click/loop triggers.
* Added smart preset suggestions based on your content.
* Added reduced-motion-safe runtime defaults.

== Upgrade Notice ==

= 1.1.0 =
Adds scroll-controlled video playback and contextual media scroll controls.

= 1.0.0 =
Initial public release.
