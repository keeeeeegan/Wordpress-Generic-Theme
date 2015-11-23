<?php @header( 'HTTP/1.1 404 Not found', true, 404 ); ?>
<?php disallow_direct_load( '404.php' ); ?>

<?php get_header(); the_post(); ?>

<main class="site-main" id="page-not-found">
	<div class="container">
		<div class="row">
			<div class="col-md-9 col-sm-9">
				<article class="page-content">
					<h1>Page Not Found</h1>
					<?php
					$page = get_page_by_title( '404' );
					$content = null;
					if ( $page ) {
						$content = $page->post_content;
						$content = apply_filters( 'the_content', $content );
						$content = str_replace( ']]>', ']]>', $content );
					}
					?>
					<?php if ( $content ): ?>
						<?php echo $content; ?>
					<?php else: ?>
						<p>The page you requested doesn't exist.  Sorry about that.</p>
					<?php endif; ?>
				</article>
			</div>
			<div class="col-md-3 col-sm-3">
				<aside class="sidebar">
					<?php echo get_sidebar(); ?>
				</aside>
			</div>
		</div>
		<?php get_template_part( 'includes/below-the-fold' ); ?>
	</div>
</main>

<?php get_footer();?>
