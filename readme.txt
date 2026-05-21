=== AniLibrary ===
Contributors: fearlessfuture
Tags: gutenberg, block, animation, scroll, motion
Requires at least: 6.5
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.0
License: MIT
License URI: https://opensource.org/license/mit

Add easy animations to any block in the WordPress editor.

== Description ==

AniLibrary gives you one wrapper block that can hold almost any other block. Add the wrapper, drop your content inside, choose an animation, and you're done.

Features:

* Works with core blocks, groups, columns, and most custom blocks.
* Choose when animations start: page load, scroll into view, hover, click, or loop.
* Suggests animation styles based on the content inside.
* Respects users who prefer reduced motion.
* Lightweight front-end output.
* No tracking and no outside asset requests.

== Installation ==

1. Upload the plugin files to `/wp-content/plugins/animation-block-wrapper`, or install through the WordPress plugins screen.
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

= 1.0.0 =
* Initial release.
* Added wrapper block with load/scroll/hover/click/loop triggers.
* Added smart preset suggestions based on your content.
* Added reduced-motion-safe runtime defaults.

== Upgrade Notice ==

= 1.0.0 =
Initial public release.
