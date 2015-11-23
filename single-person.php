<?php disallow_direct_load( 'single.php' ); ?>
<?php get_header(); the_post(); ?>

<main class="site-main single-person" id="person-<?php echo $post->post_name; ?>">
	<div class="container">
		<article class="page-content person-profile">
			<div class="row">
				<div class="col-md-2 col-sm-2">
					<?php
					$title     = get_post_meta( $post->ID, 'person_jobtitle', True );
					$image_url = get_featured_image_url( $post->ID );
					$email     = get_post_meta( $post->ID, 'person_email', True );
					$phones    = Person::get_phones( $post );

					if ( !$image_url ) {
						$image_url = get_bloginfo( 'stylesheet_directory' ).'/static/img/no-photo.jpg';
					}
					?>

					<img class="img-responsive" src="<?php echo $image_url; ?>">

					<?php if ( count( $phones ) ): ?>
					<ul class="phones list-unstyled">
						<?php foreach ( $phones as $phone ): ?>
						<li><?php echo $phone; ?></li>
						<?php endforeach; ?>
					</ul>
					<?php endif; ?>

					<?php if ( $email != '' ): ?>
					<hr>
					<a class="email" href="mailto:<?php echo $email; ?>"><?php echo $email; ?></a>
					<?php endif; ?>
				</div>
				<div class="col-md-10 col-sm-10">
					<h1><?php echo $post->post_title; ?><?php echo ( $title == '' ) ?: ' - ' . $title; ?></h1>
					<?php echo the_content(); ?>
				</div>
			</div>
		</article>

		<?php get_template_part( 'includes/below-the-fold' ); ?>
	</div>
</main>

<?php get_footer(); ?>
