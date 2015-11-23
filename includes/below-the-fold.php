<aside class="below-the-fold">
	<div class="row">
		<div class="col-md-4 col-sm-4">
			<?php if ( get_theme_option( 'enable_flickr' ) ): ?>
				<?php display_flickr( 'h2' ); ?>
			<?php else: ?>&nbsp;
				<?php debug( "Flickr images are disabled." ); ?>
			<?php endif; ?>
			<?php if ( !function_exists( 'dynamic_sidebar' ) || !dynamic_sidebar( 'Bottom Left' ) ): ?><?php endif; ?>
		</div>
		<div class="col-md-4 col-sm-4">
			<?php if ( get_theme_option( 'enable_news' ) ): ?>
				<?php display_news( 'h2' ); ?>
			<?php else: ?>&nbsp;
				<?php debug( "News feed is disabled." ); ?>
			<?php endif; ?>
			<?php if ( !function_exists( 'dynamic_sidebar' ) || !dynamic_sidebar( 'Bottom Center' ) ): ?><?php endif; ?>
		</div>
		<div class="col-md-4 col-sm-4">
			<?php if ( get_theme_option( 'enable_events' ) ): ?>
				<?php display_events( 'h2' ); ?>
			<?php else: ?>&nbsp;
				<?php debug( "Events feed is disabled." ); ?>
			<?php endif; ?>
			<?php if ( !function_exists( 'dynamic_sidebar' ) || !dynamic_sidebar( 'Bottom Right' ) ): ?><?php endif; ?>
		</div>
	</div>
</aside>
