<?php get_header();?>
	<?php $options = get_option(THEME_OPTIONS_NAME);?>
	<?php $page    = get_page_by_title('Home');?>
	<div class="span-24 last page-content" id="home" data-template="home-description">
		<div class="site-image span-16">
			<?php $image = wp_get_attachment_image($options['site_image'], 'homepage')?>
			<?php if($image):?>
				<?=$image?>
			<?php else:?>
				<img height="400px" width="620px" src="<?=THEME_IMG_URL?>/default-site-image-540.jpg">
			<?php endif;?>
		</div>
		
		<div class="right-column span-8 last">
			<?php $description = $options['site_description'];?>
			<?php if($description):?>
			<div class="description">
				<p><?=$description?></p>
			</div>
			<?php endif;?>
			
			<div class="search">
				<?php get_search_form();?>
			</div>
		</div>
		
		
		<div class="bottom span-24 last">
			<div class="content span-15 append-1">
				<?php $content = str_replace(']]>', ']]&gt;', apply_filters('the_content', $page->post_content));?>
				<?=$content?>
			</div>
		
			<div class="span-8 last">
				<?php display_events()?>
			</div>
		</div>
		
		<?php get_template_part('includes/below-the-fold'); ?>
	</div>

<?php get_footer();?>