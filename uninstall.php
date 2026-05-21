<?php
/**
 * Uninstall handler for AniLibrary.
 *
 * @package AnimationBlockWrapper
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

// Intentionally no data deletion in v1.
// Future opt-in cleanup can be added when persistent settings/storage exist.
