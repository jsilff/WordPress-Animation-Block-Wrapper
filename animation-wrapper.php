<?php
/**
 * Plugin Name:       AniLibrary
 * Plugin URI:        https://github.com/jsilff/wordpress-animation-block-wrapper
 * Description:       Wrap any block and apply lightweight, content-aware animations.
 * Version:           1.0.0
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Author:            Fearless Future
 * Author URI:        https://ff.design
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       anilibrary
 * Domain Path:       /languages
 *
 * @package AnimationBlockWrapper
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'ABW_PLUGIN_VERSION', '1.0.0' );
define( 'ABW_PLUGIN_FILE', __FILE__ );
define( 'ABW_PLUGIN_DIR', plugin_dir_path( __FILE__ ) );
define( 'ABW_PLUGIN_URL', plugin_dir_url( __FILE__ ) );

/**
 * Loads an asset metadata file.
 *
 * @param string $asset_name Asset basename without extension.
 *
 * @return array<string,mixed>
 */
function abw_get_asset_meta( $asset_name ) {
	$asset_path = ABW_PLUGIN_DIR . 'build/' . $asset_name . '.asset.php';
	if ( file_exists( $asset_path ) ) {
		$asset_data = include $asset_path;
		if ( is_array( $asset_data ) ) {
			return $asset_data;
		}
	}

	return array(
		'dependencies' => array(),
		'version'      => ABW_PLUGIN_VERSION,
	);
}

/**
 * Registers script/style handles for the block.
 *
 * @return void
 */
function abw_register_assets() {
	$editor_asset = abw_get_asset_meta( 'index' );
	$view_asset   = abw_get_asset_meta( 'view' );

	wp_register_script(
		'abw-editor-script',
		ABW_PLUGIN_URL . 'build/index.js',
		isset( $editor_asset['dependencies'] ) && is_array( $editor_asset['dependencies'] ) ? $editor_asset['dependencies'] : array(),
		isset( $editor_asset['version'] ) ? $editor_asset['version'] : ABW_PLUGIN_VERSION,
		true
	);

	wp_register_script(
		'abw-view-script',
		ABW_PLUGIN_URL . 'build/view.js',
		isset( $view_asset['dependencies'] ) && is_array( $view_asset['dependencies'] ) ? $view_asset['dependencies'] : array(),
		isset( $view_asset['version'] ) ? $view_asset['version'] : ABW_PLUGIN_VERSION,
		array(
			'in_footer' => true,
			'strategy'  => 'defer',
		)
	);

	wp_register_style(
		'abw-editor-style',
		ABW_PLUGIN_URL . 'build/index.css',
		array(),
		ABW_PLUGIN_VERSION
	);

	wp_register_style(
		'abw-style',
		ABW_PLUGIN_URL . 'build/style.css',
		array(),
		ABW_PLUGIN_VERSION
	);

	if ( function_exists( 'wp_set_script_translations' ) ) {
		wp_set_script_translations( 'abw-editor-script', 'anilibrary', ABW_PLUGIN_DIR . 'languages' );
	}
}

/**
 * Registers the block type from metadata using explicit asset handles.
 *
 * Metadata keeps attribute/support schema in one source of truth (`block.json`),
 * while explicit handles preserve predictable asset loading in symlinked setups.
 *
 * @return void
 */
function abw_register_block() {
	abw_register_assets();

	register_block_type(
		ABW_PLUGIN_DIR,
		array(
			'editor_script' => 'abw-editor-script',
			'editor_style'  => 'abw-editor-style',
			'style'         => 'abw-style',
			'script'        => 'abw-view-script',
		)
	);
}
add_action( 'init', 'abw_register_block' );
