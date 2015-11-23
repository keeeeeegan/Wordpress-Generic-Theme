<!DOCTYPE html>
<html lang="en-US">
	<head>
		<?php echo header_(); ?>
	</head>
	<body ontouchstart class="<?php echo body_classes(); ?>">
		<header class="site-header">
			<div class="container">
				<div class="row">
					<div class="col-md-9 col-sm-9">
						<?php echo display_site_title(); ?>
					</div>
					<div class="col-md-3 col-sm-3">
						<?php echo display_social_follow_menu(); ?>
					</div>
				</div>
				<?php
				wp_nav_menu( array(
					'theme_location' => 'header-menu',
					'container' => false,
					'menu_class' => get_header_styles(),
					'menu_id' => 'site-header-menu',
					'walker' => new Bootstrap_Walker_Nav_Menu()
				) );
				?>
			</div>
		</header>
