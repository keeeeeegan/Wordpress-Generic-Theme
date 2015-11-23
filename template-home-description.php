<?php disallow_direct_load( 'template-home-description.php' ); ?>
<?php get_header(); the_post(); ?>

<main class="site-main home-description">
	<div class="container">
		<div class="row">
			<div class="col-md-8 col-sm-8">
				<?php $image = wp_get_attachment_image( get_theme_option( 'site_image' ), 'homepage', false, array( 'class' => 'home-image img-responsive' ) ); ?>
				<?php if ( $image ): ?>
					<?php echo $image; ?>
				<?php else: ?>
					<img class="home-image img-responsive" width="770" src="<?php echo THEME_IMG_URL; ?>/default-site-image-540.jpg">
				<?php endif; ?>
			</div>
			<div class="col-md-4 col-sm-4">
				<?php $description = get_theme_option( 'site_description' ); ?>
				<?php if ( $description ): ?>
				<div class="home-description">
					<p><?php echo $description; ?></p>
				</div>
				<?php endif; ?>

				<div class="well search">
					<?php get_search_form(); ?>
				</div>
			</div>
		</div>
		<div class="home-bottom">
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

		<?php get_template_part( 'includes/below-the-fold' ); ?>
	</div>
</main>

<?php get_footer(); ?>
