<?php
require_once 'functions/base.php';    // Base theme functions
require_once 'functions/feeds.php';   // Where functions related to feed data live
require_once 'custom-taxonomies.php'; // Where per theme taxonomies are defined
require_once 'custom-post-types.php'; // Where per theme post types are defined
require_once 'functions/admin.php';   // Admin/login functions
require_once 'functions/config.php';  // Where per theme settings are registered
require_once 'shortcodes.php';        // Per theme shortcodes

// Add theme-specific functions below this line.

/**
 * Conditionally displays a <h1> or <span> for the site's primary title
 * depending on the current page being viewed.
 **/
function display_site_title() {
	$elem = ( is_home() || is_front_page() ) ? 'h1' : 'span';
	ob_start();
?>
	<<?php echo $elem; ?> class="site-title">
		<a href="<?php echo bloginfo( 'url' ); ?>"><?php echo bloginfo( 'name' ); ?></a>
	</<?php echo $elem; ?>>
<?php
	return ob_get_clean();
}


/**
 * Displays a menu of social icons.
 **/
function display_social_follow_menu() {
	$facebook_url = get_theme_option( 'facebook_url' );
	$twitter_url = get_theme_option( 'twitter_url' );

	ob_start();
?>
	<?php if ( $facebook_url || $twitter_url ): ?>
	<ul class="social-menu">
		<?php if ( $facebook_url ): ?>
		<li><a href="<?php echo $facebook_url; ?>">Facebook</a></li>
		<?php endif; ?>
		<?php if ( $twitter_url ): ?>
		<li><a href="<?php echo $twitter_url; ?>">Twitter</a></li>
		<?php endif; ?>
	</ul>
	<?php endif; ?>
<?php
	return ob_get_clean();
}

?>
