<?php
/**
 * Template Name: Two Column
 **/
?>
<?php get_header(); the_post(); ?>

<main class="site-main page-two-column" id="page-<?php echo $post->post_name; ?>">
	<div class="container">
		<div class="row">
			<div class="col-md-9 col-sm-9">
				<article class="page-content">
					<?php if ( !is_front_page() ): ?>
					<h1><?php the_title(); ?></h1>
					<?php endif; ?>

					<?php the_content(); ?>
				</article>
			</div>
			<div class="col-md-3 col-sm-3">
				<aside class="sidebar">
					<?php echo get_sidebar(); ?>
				</aside>
			</div>
		</div>

		<?php
		$hide_fold = get_post_meta( $post->ID, 'page_hide_fold', True );
		if ( $hide_fold && $hide_fold[0] !== 'On' ) {
			get_template_part( 'includes/below-the-fold' );
		}
		?>
	</div>
</main>

<?php get_footer(); ?>
