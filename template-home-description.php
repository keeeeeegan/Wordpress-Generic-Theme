<?php get_header(); ?>
	<div class="page-content" id="home" data-template="home-description">
		<div class="row">
			<div class="site-image col-md-8 col-sm-8">
				<?php $image = wp_get_attachment_image( get_theme_option( 'site_image' ), 'homepage' ); ?>
				<?php if ( $image ): ?>
					<?php echo $image; ?>
				<?php else: ?>
					<img class="img-responsive" width="770" src="<?php echo THEME_IMG_URL; ?>/default-site-image-540.jpg">
				<?php endif; ?>
			</div>

			<div class="right-column col-md-4 col-sm-4 last">
				<?php $description = get_theme_option( 'site_description' ); ?>
				<?php if ( $description ): ?>
				<div class="description">
					<p><?php echo $description; ?></p>
				</div>
				<?php endif;?>

				<div class="search">
					<?php get_search_form(); ?>
				</div>
			</div>
		</div>
		<div class="row">
			<div class="bottom col-md-12 col-sm-12">
				<?php
				$content = '';
				$page = get_page_by_title( 'Home' );

				if ( $page ) {
					$content = str_replace( ']]>', ']]&gt;', apply_filters( 'the_content', $page->post_content ) );
				}
				?>

				<?php if ( $content ): ?>
					<?php echo $content; ?>
				<?php endif; ?>
			</div>
		</div>
	</div>
	<?php get_template_part( 'includes/below-the-fold' ); ?>
<?php get_footer(); ?>
