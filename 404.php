<?php @header( 'HTTP/1.1 404 Not found', true, 404 ); ?>
<?php disallow_direct_load( '404.php' ); ?>

<?php get_header(); the_post(); ?>
	<div class="row page-content" id="page-not-found">
		<div class="col-md-9 col-sm-9">
			<article>
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

		<div id="sidebar" class="col-md-3 col-sm-3">
			<?php echo get_sidebar(); ?>
		</div>
	</div>
	<?php get_template_part( 'includes/below-the-fold' ); ?>
<?php get_footer();?>
