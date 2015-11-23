<?php
/**
 * Template Name: One Column
 **/
?>
<?php get_header(); the_post(); ?>

<main class="site-main page-one-column" id="page-<?php echo $post->post_name; ?>">
	<div class="container">
		<article class="page-content">
			<?php if ( !is_front_page() ): ?>
			<h1><?php the_title(); ?></h1>
			<?php endif; ?>

			<?php the_content(); ?>
		</article>

		<?php
		$hide_fold = get_post_meta( $post->ID, 'page_hide_fold', True );
		if ( $hide_fold && $hide_fold[0] !== 'On' ) {
			get_template_part( 'includes/below-the-fold' );
		}
		?>
	</div>
</main>

<?php get_footer(); ?>
