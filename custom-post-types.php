<?php

abstract class CustomPostType{
	public 
		$name           = 'custom_post_type',
		$plural_name    = 'Custom Posts',
		$singular_name  = 'Custom Post',
		$add_new_item   = 'Add New Custom Post',
		$edit_item      = 'Edit Custom Post',
		$new_item       = 'New Custom Post',
		$public         = True,  # I dunno...leave it true
		$use_title      = True,  # Title field
		$use_editor     = True,  # WYSIWYG editor, post content field
		$use_revisions  = True,  # Revisions on post content and titles
		$use_thumbnails = False, # Featured images
		$use_order      = False, # Wordpress built-in order meta data
		$use_metabox    = False, # Enable if you have custom fields to display in admin
		$use_shortcode  = False, # Auto generate a shortcode for the post type
		                         # (see also objectsToHTML and toHTML methods)
		$taxonomies     = array('post_tag'),
		$built_in       = False;
	
	
	/**
	 * Wrapper for get_posts function, that predefines post_type for this
	 * custom post type.  Any options valid in get_posts can be passed as an
	 * option array.  Returns an array of objects.
	 **/
	public function get_objects($options=array()){

		$defaults = array(
			'numberposts'   => -1,
			'orderby'       => 'title',
			'order'         => 'ASC',
			'post_type'     => $this->options('name'),
		);
		$options = array_merge($defaults, $options);
		$objects = get_posts($options);
		return $objects;
	}
	
	
	/**
	 * Similar to get_objects, but returns array of key values mapping post
	 * title to id if available, otherwise it defaults to id=>id.
	 **/
	public function get_objects_as_options($options=array()){
		$objects = $this->get_objects($options);
		$opt     = array();
		foreach($objects as $o){
			switch(True){
				case $this->options('use_title'):
					$opt[$o->post_title] = $o->ID;
					break;
				default:
					$opt[$o->ID] = $o->ID;
					break;
			}
		}
		return $opt;
	}
	
	
	/**
	 * Return the instances values defined by $key.
	 **/
	public function options($key){
		$vars = get_object_vars($this);
		return $vars[$key];
	}
	
	
	/**
	 * Additional fields on a custom post type may be defined by overriding this
	 * method on an descendant object.
	 **/
	public function fields(){
		return array();
	}
	
	
	/**
	 * Using instance variables defined, returns an array defining what this
	 * custom post type supports.
	 **/
	public function supports(){
		#Default support array
		$supports = array();
		if ($this->options('use_title')){
			$supports[] = 'title';
		}
		if ($this->options('use_order')){
			$supports[] = 'page-attributes';
		}
		if ($this->options('use_thumbnails')){
			$supports[] = 'thumbnail';
		}
		if ($this->options('use_editor')){
			$supports[] = 'editor';
		}
		if ($this->options('use_revisions')){
			$supports[] = 'revisions';
		}
		return $supports;
	}
	
	
	/**
	 * Creates labels array, defining names for admin panel.
	 **/
	public function labels(){
		return array(
			'name'          => __($this->options('plural_name')),
			'singular_name' => __($this->options('singular_name')),
			'add_new_item'  => __($this->options('add_new_item')),
			'edit_item'     => __($this->options('edit_item')),
			'new_item'      => __($this->options('new_item')),
		);
	}
	
	
	/**
	 * Creates metabox array for custom post type. Override method in
	 * descendants to add or modify metaboxes.
	 **/
	public function metabox(){
		if ($this->options('use_metabox')){
			return array(
				'id'       => $this->options('name').'_metabox',
				'title'    => __($this->options('singular_name').' Fields'),
				'page'     => $this->options('name'),
				'context'  => 'normal',
				'priority' => 'high',
				'fields'   => $this->fields(),
			);
		}
		return null;
	}
	
	
	/**
	 * Registers metaboxes defined for custom post type.
	 **/
	public function register_metaboxes(){
		if ($this->options('use_metabox')){
			$metabox = $this->metabox();
			add_meta_box(
				$metabox['id'],
				$metabox['title'],
				'show_meta_boxes',
				$metabox['page'],
				$metabox['context'],
				$metabox['priority']
			);
		}
	}
	
	
	/**
	 * Registers the custom post type and any other ancillary actions that are
	 * required for the post to function properly.
	 **/
	public function register(){
		$registration = array(
			'labels'     => $this->labels(),
			'supports'   => $this->supports(),
			'public'     => $this->options('public'),
			'taxonomies' => $this->options('taxonomies'),
			'_builtin'   => $this->options('built_in')
		);
		
		if ($this->options('use_order')){
			$registration = array_merge($registration, array('hierarchical' => True,));
		}
		
		register_post_type($this->options('name'), $registration);
		
		if ($this->options('use_shortcode')){
			add_shortcode($this->options('name').'-list', array($this, 'shortcode'));
		}
	}
	
	
	/**
	 * Shortcode for this custom post type.  Can be overridden for descendants.
	 * Defaults to just outputting a list of objects outputted as defined by
	 * toHTML method.
	 **/
	public function shortcode($attr){
		$default = array(
			'type' => $this->options('name'),
		);
		if (is_array($attr)){
			$attr = array_merge($default, $attr);
		}else{
			$attr = $default;
		}
		return sc_object_list($attr);
	}
	
	
	/**
	 * Handles output for a list of objects, can be overridden for descendants.
	 * If you want to override how a list of objects are outputted, override
	 * this, if you just want to override how a single object is outputted, see
	 * the toHTML method.
	 **/
	public function objectsToHTML($objects, $css_classes){
		if (count($objects) < 1){ return '';}
		
		$class = get_custom_post_type($objects[0]->post_type);
		$class = new $class;
		
		ob_start();
		?>
		<ul class="<?php if($css_classes):?><?=$css_classes?><?php else:?><?=$class->options('name')?>-list<?php endif;?>">
			<?php foreach($objects as $o):?>
			<li>
				<?=$class->toHTML($o)?>
			</li>
			<?php endforeach;?>
		</ul>
		<?php
		$html = ob_get_clean();
		return $html;
	}
	
	
	/**
	 * Outputs this item in HTML.  Can be overridden for descendants.
	 **/
	public function toHTML($object){
		$html = '<a href="'.get_permalink($object->ID).'">'.$object->post_title.'</a>';
		return $html;
	}
}


class Document extends CustomPostType{
	public
		$name           = 'document',
		$plural_name    = 'Documents',
		$singular_name  = 'Document',
		$add_new_item   = 'Add New Document',
		$edit_item      = 'Edit Document',
		$new_item       = 'New Document',
		$use_title      = True,
		$use_editor     = False,
		$use_shortcode  = True,
		$use_metabox    = True;
	
	public function fields(){
		$fields   = parent::fields();
		$fields[] = array(
			'name' => __('URL'),
			'desc' => __('Associate this document with a URL.  This will take precedence over any uploaded file, so leave empty if you want to use a file instead.'),
			'id'   => $this->options('name').'_url',
			'type' => 'text',
		);
		$fields[] = array(
			'name'    => __('File'),
			'desc'    => __('Associate this document with an already existing file.'),
			'id'      => $this->options('name').'_file',
			'type'    => 'file',
		);
		return $fields;
	}
	
	
	static function get_document_application($form){
		return mimetype_to_application(self::get_mimetype($form));
	}
	
	
	static function get_mimetype($form){
		if (is_numeric($form)){
			$form = get_post($form);
		}
		
		$prefix   = post_type($form);
		$document = get_post(get_post_meta($form->ID, $prefix.'_file', True));
		
		$is_url = get_post_meta($form->ID, $prefix.'_url', True);
		
		return ($is_url) ? "text/html" : $document->post_mime_type;
	}
	
	
	static function get_title($form){
		if (is_numeric($form)){
			$form = get_post($form);
		}
		
		$prefix = post_type($form);
		
		return $form->post_title;
	}
	
	static function get_url($form){
		if (is_numeric($form)){
			$form = get_post($form);
		}
		
		$prefix = post_type($form);
		
		$x = get_post_meta($form->ID, $prefix.'_url', True);
		$y = wp_get_attachment_url(get_post_meta($form->ID, $prefix.'_file', True));
		
		if (!$x and !$y){
			return '#';
		}
		
		return ($x) ? $x : $y;
	}
	
	
	/**
	 * Handles output for a list of objects, can be overridden for descendants.
	 * If you want to override how a list of objects are outputted, override
	 * this, if you just want to override how a single object is outputted, see
	 * the toHTML method.
	 **/
	public function objectsToHTML($objects, $css_classes){
		if (count($objects) < 1){ return '';}
		
		$class_name = get_custom_post_type($objects[0]->post_type);
		$class      = new $class_name;
		
		ob_start();
		?>
		<ul class="nobullet <?php if($css_classes):?><?=$css_classes?><?php else:?><?=$class->options('name')?>-list<?php endif;?>">
			<?php foreach($objects as $o):?>
			<li class="document <?=$class_name::get_document_application($o)?>">
				<?=$class->toHTML($o)?>
			</li>
			<?php endforeach;?>
		</ul>
		<?php
		$html = ob_get_clean();
		return $html;
	}
	
	
	/**
	 * Outputs this item in HTML.  Can be overridden for descendants.
	 **/
	public function toHTML($object){
		$title = Document::get_title($object);
		$url   = Document::get_url($object);
		$html = "<a href='{$url}'>{$title}</a>";
		return $html;
	}
}


class Video extends CustomPostType{
	public 
		$name           = 'video',
		$plural_name    = 'Videos',
		$singular_name  = 'Video',
		$add_new_item   = 'Add New Video',
		$edit_item      = 'Edit Video',
		$new_item       = 'New Video',
		$public         = True,
		$use_editor     = False,
		$use_thumbnails = True,
		$use_order      = True,
		$use_title      = True,
		$use_metabox    = True;
	
	public function get_player_html($video){
		return sc_video(array('video' => $video));
	}
	
	public function metabox(){
		$metabox = parent::metabox();
		
		$metabox['title']   = 'Videos on Media Page';
		$metabox['helptxt'] = 'Video icon will be resized to width 210px, height 118px.';
		return $metabox;
	}
	
	public function fields(){
		$prefix = $this->options('name').'_';
		return array(
			array(
				'name' => 'URL',
				'desc' => 'YouTube URL pointing to video.<br>  Example: http://www.youtube.com/watch?v=IrSeMg7iPbM',
				'id'   => $prefix.'url',
				'type' => 'text',
				'std'  => ''
			),
			array(
				'name' => 'Video Description',
				'desc' => 'Short description of the video.',
				'id'   => $prefix.'description',
				'type' => 'textarea',
				'std'  => ''
			),
			array(
				'name' => 'Shortcode',
				'desc' => 'To include this video in other posts, use the following shortcode:',
				'id'   => 'video_shortcode',
				'type' => 'shortcode',
				'value' => '[video name="TITLE"]',
			),
		);
	}
}


class Publication extends CustomPostType{
	public 
		$name           = 'publication',
		$plural_name    = 'Publications',
		$singular_name  = 'Publication',
		$add_new_item   = 'Add New Publication',
		$edit_item      = 'Edit Publication',
		$new_item       = 'New Publication',
		$public         = True,
		$use_editor     = False,
		$use_thumbnails = True,
		$use_order      = True,
		$use_title      = True,
		$use_metabox    = True;
	
	public function toHTML($pub){
		return sc_publication(array('pub' => $pub));
	}
	
	public function metabox(){
		$metabox = parent::metabox();
		
		$metabox['title']   = 'Publications on Media Page';
		$metabox['helptxt'] = 'Publication cover icon will be resized to width 153px, height 198px.';
		return $metabox;
	}
	
	public function fields(){
		$prefix = $this->options('name').'_';
		return array(
			array(
				'name'  => 'Publication URL',
				'desc' => 'Example: <span style="font-family:monospace;font-weight:bold;color:#21759B;">http://publications.smca.ucf.edu/admissions/viewbook.html</span>',
				'id'   => $prefix.'url',
				'type' => 'text',
				'std'  => '',
			),
			array(
				'name' => 'Shortcode',
				'desc' => 'To include this publication in other posts, use the following shortcode: <input disabled="disabled" type="text" value="[publication name=]" />',
				'id'   => 'publication_shortcode',
				'type' => 'help',
				'value' => '[publication name="TITLE"]',
			),
		);
	}
}

class Page extends CustomPostType {
	public
		$name           = 'page',
		$plural_name    = 'Pages',
		$singular_name  = 'Page',
		$add_new_item   = 'Add New Page',
		$edit_item      = 'Edit Page',
		$new_item       = 'New Page',
		$public         = True,
		$use_editor     = True,
		$use_thumbnails = False,
		$use_order      = True,
		$use_title      = True,
		$use_metabox    = True,
		$built_in       = True;

	public function fields() {
		$prefix = $this->options('name').'_';
		return array(
			array(
				'name' => 'Hide Lower Section',
				'desc' => 'This section normally contains the Flickr, News and Events widgets. The footer will not be hidden',
				'id'   => $prefix.'hide_fold',
				'type' => 'checkbox',
			)
		);
	}
}

/**
 * Describes a staff member
 *
 * @author Chris Conover
 **/
class Person extends CustomPostType
{
	/*
	The following query will pre-populate the person_orderby_name
	meta field with a guess of the last name extracted from the post title.
	
	>>>BE SURE TO REPLACE wp_<number>_... WITH THE APPROPRIATE SITE ID<<<
	
	INSERT INTO wp_29_postmeta(post_id, meta_key, meta_value) 
	(	SELECT	id AS post_id, 
						'person_orderby_name' AS meta_key, 
						REVERSE(SUBSTR(REVERSE(post_title), 1, LOCATE(' ', REVERSE(post_title)))) AS meta_value
		FROM		wp_29_posts AS posts
		WHERE		post_type = 'person' AND
						(	SELECT meta_id 
							FROM wp_29_postmeta 
							WHERE post_id = posts.id AND
										meta_key = 'person_orderby_name') IS NULL)
	*/
	
	public
		$name           = 'person',
		$plural_name    = 'People',
		$singular_name  = 'Person',
		$add_new_item   = 'Add Person',
		$edit_item      = 'Edit Person',
		$new_item       = 'New Person',
		$public         = True,
		$use_shortcode  = True,
		$use_metabox    = True,
		$use_thumbnails = True,
		$use_order      = True,
		$taxonomies     = array('org_groups', 'category');
		
		public function fields(){
			$fields = array(
				array(
					'name'    => __('Title Prefix'),
					'desc'    => '',
					'id'      => $this->options('name').'_title_prefix',
					'type'    => 'text',
				),
				array(
					'name'    => __('Title Suffix'),
					'desc'    => __('Be sure to include leading comma or space if neccessary.'),
					'id'      => $this->options('name').'_title_suffix',
					'type'    => 'text',
				),
				array(
					'name'    => __('Job Title'),
					'desc'    => __(''),
					'id'      => $this->options('name').'_jobtitle',
					'type'    => 'text',
				),
				array(
					'name'    => __('Phone'),
					'desc'    => __('Separate multiple entries with commas.'),
					'id'      => $this->options('name').'_phones',
					'type'    => 'text',
				),
				array(
					'name'    => __('Email'),
					'desc'    => __(''),
					'id'      => $this->options('name').'_email',
					'type'    => 'text',
				),
				array(
					'name'    => __('Order By Name'),
					'desc'    => __('Name used for sorting. Leaving this field blank may lead to an unexpected sort order.'),
					'id'      => $this->options('name').'_orderby_name',
					'type'    => 'text',
				),
			);
			return $fields;
		}
	
	public function get_objects($options=array()){
		$options['order']    = 'ASC';
		$options['orderby']  = 'person_orderby_name';
		$options['meta_key'] = 'person_orderby_name';
		return parent::get_objects($options);
	}

	public static function get_name($person) {
		$prefix = get_post_meta($person->ID, 'person_title_prefix', True);
		$suffix = get_post_meta($person->ID, 'person_title_suffix', True);
		$name = $person->post_title;
		return $prefix.' '.$name.$suffix;
	}

	public static function get_phones($person) {
		$phones = get_post_meta($person->ID, 'person_phones', True);
		return ($phones != '') ? explode(',', $phones) : array();
	}

	public function objectsToHTML($people, $css_classes) {
		
		# Separate the people into sections based on their
		# organization group affiliation(s)
		$sections = array();
		foreach($people as $person) {
			$terms = wp_get_post_terms($person->ID, 'org_groups');
			if(count($terms) == 0) {
				if(!isset($sections[''])) {
					$sections[''] = array();
				}
				$terms[''][] = $person;
			} else {
				foreach($terms as $term) {
					if(!isset($sections[$term->name])) {
						$sections[$term->name] = array();
					}
					$sections[$term->name][] = $person;
				}
			}
		}

		# Display each section
		ob_start();
		foreach($sections as $name => $people) {
		?>
		<div class="people-org-group">
			<? if($name != ''): ?><h3><?=$name?></h3><? endif ?>
			<table class="table table-striped">
				<thead>
					<tr>
						<th scope="col" class="name">Name</th>
						<th scope="col" class="job_title">Title</th>
						<th scope="col" class="phones">Phone(s)</th>
						<th scope="col" class="email">E-Mail</th>
					</tr>
				</thead>
				<tbody>
					<?$count = 0;
						foreach($people as $person) {
							$count++;
							$email     = get_post_meta($person->ID, 'person_email', True);
						?>
							<tr>
								<td class="name">
									<a href="<?=get_permalink($person->ID)?>"><?=$this->get_name($person)?></a>
								</td>
								<td class="job_title">
									<a href="<?=get_permalink($person->ID)?>"><?=get_post_meta($person->ID, 'person_jobtitle', True)?></a>
								</td> 
								<td class="phones">
									<a href="<?=get_permalink($person->ID)?>">
										<ul>
											<? foreach($this->get_phones($person) as $phone) { ?>
											<li><?=$phone?></li>
											<? } ?>
										</ul>
									</a>
								</td>
								<td class="email">
									<?=(($email != '') ? '<a href="mailto:'.$email.'">'.$email.'</a>' : '')?>
								</td>
							</tr>
					<? } ?>
				</tbody>
			</table>
		</div>
		<?
		}
		return ob_get_clean();
	}
} // END class 


/**
 * Describes a graph
 *
 * @author Jo Greybill
 **/
class Graph extends CustomPostType
{
	
	public
	
		$name           = 'graph',
		$plural_name    = 'Graphs',
		$singular_name  = 'Graph',
		$add_new_item   = 'Add New Graph',
		$edit_item      = 'Edit Graph',
		$new_item       = 'New Graph',
		$public         = True,  # I dunno...leave it true
		$use_title      = True,  # Title field
		$use_editor     = False, # WYSIWYG editor, post content field
		$use_revisions  = True,  # Revisions on post content and titles
		$use_thumbnails = True,  # Featured images
		$use_order      = False, # Wordpress built-in order meta data
		$use_metabox    = True,  # Enable if you have custom fields to display in admin
		$use_shortcode  = True,  # Auto generate a shortcode for the post type
		                         # (see also objectsToHTML and toHTML methods)
		$built_in       = False;
	
	
	
// Graph field setup: //
		
		public function fields(){
			$prefix = $this->options('name').'_';
			
			return array(
				array(
					'name' => 'Graph Type',
					'desc' => '',
					'id'   => $prefix.'graphtype',
					'type' => 'select',
					'options' => array('Bar Graph' => 'Bar', 'Line Graph' => 'Line', 'Pie Graph' => 'Pie'),
				),
				array(
					'name'  => 'Canvas Dimensions',
					'desc' => 'Specify the width and height of the graph canvas, separated by an "x"; e.g. "500x300"',
					'id'   => $prefix.'dimensions',
					'type' => 'text',
				),
				array(
					'name'  => 'Canvas Gutter - Top',
					'desc' => 'Specify the top gutter for your graph, in pixels; e.g. "50".  Gutters are essentially padding for the canvas and will push against the graph and its labels, titles, and key (if it exists), shrinking the graph down in the process.  Specifying a gutter is beneficial particularly when you have long labels that stretch past the point of the canvas.',
					'id'   => $prefix.'gutter_top',
					'type' => 'text',
				),
				array(
					'name'  => 'Canvas Gutter - Right',
					'desc' => 'Specify the right-hand gutter for your graph, in pixels; e.g. "50"',
					'id'   => $prefix.'gutter_right',
					'type' => 'text',
				),
				array(
					'name'  => 'Canvas Gutter - Bottom',
					'desc' => 'Specify the bottom gutter for your graph, in pixels; e.g. "50"',
					'id'   => $prefix.'gutter_bottom',
					'type' => 'text',
				),
				array(
					'name'  => 'Canvas Gutter - Left',
					'desc' => 'Specify the left-hand gutter for your graph, in pixels; e.g. "50"',
					'id'   => $prefix.'gutter_left',
					'type' => 'text',
				),
				array(
					'name' => 'Data',
					'desc' => 'Type/paste your data in the textarea below.  Individual pieces of data should be separated by commas.  Do not add commas to designate thousands/ten-thousands/etc; these will be added to your data automatically.  Graphs can take a single set of data or grouped sets.  Separate groups with a pipe character "|"; e.g. "1,6,7,12|2,9,8,10|5,6,7,8"',
					'id'   => $prefix.'data',
					'type' => 'textarea',
				),
				array(
					'name' => 'Data Labels',
					'desc' => 'Specify labels for each grouped set of data.  These should be pipe-separated names ("|"), listed in the same order as their corresponding grouped sets of data; e.g. "UCF|UF|FSU"',
					'id'   => $prefix.'datalabels',
					'type' => 'text',
				),
				array(
					'name' => 'Data Colors',
					'desc' => 'Specify colors for the visual representations of each grouped set of data.  These should be pipe-separated ("|") color names, hex values, or rgb/rgba values, listed in the same order as their corresponding grouped sets of data; e.g. "#ffc907|green|rgba(0,0,0,0.6)"',
					'id'   => $prefix.'datacolors',
					'type' => 'text',
				),
				array(
					'name' => 'Graph Animation',
					'desc' => 'Select an animation method for the graph.  If you want the graph to generate without an animation, leave this blank.',
					'id'   => $prefix.'animation',
					'type' => 'select',
					'options' =>  array('ALL GRAPH TYPES:' => 'empty',
											'Canvas Fade In' 			=> 'Effects.Fade.In',
											'Canvas Expand' 			=> 'Effects.jQuery.Expand',
											'Canvas Reveal' 			=> 'Effects.jQuery.Reveal',
											'Canvas Horizontal Blinds' 	=> 'Effects.jQuery.HBlinds.Open',
											'Canvas Vertical Blinds' 	=> 'Effects.jQuery.VBlinds.Open',
											'    ' 						=> 'empty',
										'BAR GRAPHS:' => 'empty', 
											'Wave' 						=> 'Effects.Bar.Wave',
											'Grow' 						=> 'Effects.Bar.Grow',
											'   ' 						=> 'empty',	
										'LINE GRAPHS:' => 'empty', 
											'Unfold'					=> 'Effects.Line.Unfold',
											'Unfold From Center'		=> 'Effects.Line.jQuery.UnfoldFromCenter',
											'Trace, then Unfold'		=> 'Effects.Line.jQuery.UnfoldFromCenterTrace',
											'Trace'						=> 'Effects.Line.jQuery.Trace',
											'  ' 						=> 'empty',	
										'PIE GRAPHS:' => 'empty',
											'Wave ' 					=> 'Effects.Pie.Wave',
											'Grow ' 					=> 'Effects.Pie.Grow',
											'Implode' 					=> 'Effects.Pie.Implode',
											'Round Robin'				=> 'Effects.Pie.RoundRobin'
										),
				),
				array(
					'name' => 'Start Graph Animation Immediately',
					'desc' => 'Check this box to force this graph to begin animation as soon as the page has loaded.  Checking this box is particularly useful if the graph is above the fold and visible before the user scrolls down.  Otherwise, the graph will only animate as soon as the page has been scrolled and the graph is visible on the screen.',
					'id'   => $prefix.'animation_onload',
					'type' => 'checkbox',
				),
				array(
					'name' => 'Graph Key/Legend',
					'desc' => 'Specify whether the graph should include a key.  If this box is checked, the key will automatically generate a list of each Data Label, designated by their respective Data Colors.',
					'id'   => $prefix.'key',
					'type' => 'checkbox',
				),
				array(
					'name' => 'Tooltips',
					'desc' => 'Specify whether the graph should include tooltips, which appear when a data set is hovered over.  Tooltips will output the exact value of each individual piece of data.',
					'id'   => $prefix.'tooltips',
					'type' => 'checkbox',
				),
				array(
					'name' => 'Add Data Tickmarks<br/>(Line Graphs only)',
					'desc' => 'Specify whether the graph should display a dot over each piece of data in a group.  This is beneficial particularly for graphs that implement tooltips for easier access to the data\'s hover state.',
					'id'   => $prefix.'tickmarks',
					'type' => 'checkbox',
				),
				array(
					'name' => 'Line Width<br/>(Line Graphs only)',
					'desc' => 'Specify the width of all lines on the line graph.',
					'id'   => $prefix.'line_width',
					'type' => 'text',
				),
				array(
					'name' => 'Display Graph Title (turn OFF)',
					'desc' => 'Check this box if you want to remove the graph\'s title from the top of the graph.',
					'id'   => $prefix.'graphtitle_off',
					'type' => 'checkbox',
				),
				array(
					'name' => 'Graph Title Vertical Positioning',
					'desc' => 'If necessary, specify a vertical position for the main graph\'s title (assuming the Display Graph Title checkbox above is not checked.)  Enter a number between 0 and 1; the number is then multiplied with the gutter and then used as the vertical position.  As a rule of thumb, values closer to 0 will push the title closer to the top of the graph; values closer to 1 will push it farther away.',
					'id'   => $prefix.'graphtitle_pos_v',
					'type' => 'text',
				),
				array(
					'name' => 'Title - Horizontal<br/>(Bar Graphs, Line Graphs)',
					'desc' => 'This is the title for the graph\'s horizontal values.',
					'id'   => $prefix.'title_h',
					'type' => 'text',
				),
				array(
					'name' => 'Title - Vertical<br/>(Bar Graphs, Line Graphs)',
					'desc' => 'This is the title for the graph\'s vertical values.',
					'id'   => $prefix.'title_v',
					'type' => 'text',
				),
				array(
					'name' => 'Title Positioning - Horizontal<br/>(Bar Graphs, Line Graphs)',
					'desc' => 'If necessary, specify a specific position for the horizontal title.  Enter a number between 0 and 1; this number is multiplied with the whole width of the graph canvas and is then used as the horizontal position.  As a rule of thumb, values closer to 0 will push the title closer to the horizontal axis; values closer to 1 will push it farther away.',
					'id'   => $prefix.'title_pos_h',
					'type' => 'text',
				),
				array(
					'name' => 'Title Positioning - Vertical<br/>(Bar Graphs, Line Graphs)',
					'desc' => 'If necessary, specify a specific position for the vertical title.  Enter a number between 0 and 1; this number is multiplied with the gutter and is then used as the vertical position.  As a rule of thumb, values closer to 0 will push the title closer to the vertical axis; values closer to 1 will push it farther away.  Changing this is particularly useful if your vertical labels are long and overlap your vertical title.',
					'id'   => $prefix.'title_pos_v',
					'type' => 'text',
				),
				array(
					'name' => 'Labels - Horizontal<br/>(Bar Graphs, Line Graphs)',
					'desc' => 'Specify the graph\'s set of horizontal labels in a pipe-separated ("|") list, listed from left-to-right on the graph; e.g. "Jan|Feb|Mar|April|May|Jun"',
					'id'   => $prefix.'labels_h',
					'type' => 'textarea',
				),
				array(
					'name' => 'Labels - Vertical<br/>(Bar Graphs, Line Graphs)',
					'desc' => 'If you don\'t want to use a scale for vertical graph labels, specify them here in a pipe-separated ("|") list, listed from top-to-bottom on the graph; e.g. "High|Medium|Low".  If left blank, the graph will use the typical number scale.  Units of measure will not be used in vertical labels specified here.',
					'id'   => $prefix.'labels_v',
					'type' => 'textarea',
				),
				array(
					'name' => 'Grid Lines - Horizontal<br/>(Bar Graphs, Line Graphs)',
					'desc' => 'Specify the number of horizontal grid lines that will appear in the chart\'s background.  Setting this value to "none" will display no horizontal lines.',
					'id'   => $prefix.'gridlines_h',
					'type' => 'text',
				),
				array(
					'name' => 'Grid Lines - Vertical<br/>(Bar Graphs, Line Graphs)',
					'desc' => 'Specify the number of vertical grid lines that will appear in the chart\'s background.  Setting this value to "none" will display no horizontal lines.',
					'id'   => $prefix.'gridlines_v',
					'type' => 'text',
				),
				array(
					'name' => 'Toggle Off Graph Axes<br/>(Bar Graphs, Line Graphs)',
					'desc' => 'Specify whether the graph uses horizontal and vertical axes.  If this box is checked, no horizontal or vertical axes will display on the graph.',
					'id'   => $prefix.'axes_off',
					'type' => 'checkbox',
				),
				array(
					'name' => 'Units of Measure - Pre-value<br/>(Bar Graphs, Line Graphs)',
					'desc' => 'Designates the unit of measure for all graph values at the beginning of the value; e.g., setting this value to "$" will add a "$" to the beginning of each value in your graph, "$1, $6, $7, $12..."',
					'id'   => $prefix.'units_pre',
					'type' => 'text',
				),
				array(
					'name' => 'Units of Measure - Post-value<br/>(Bar Graphs, Line Graphs)',
					'desc' => 'Designates the unit of measure for all graph values at the end of the value; e.g., setting this value to "k" will add a "k" to the beginning of each value in your graph, "1k, 6k, 7k, 12k..."',
					'id'   => $prefix.'units_post',
					'type' => 'text',
				),
			);
			return $fields;
		}
		
		public function register_metaboxes(){
			$metabox = $this->metabox();
			
			global $wp_meta_boxes;
			remove_meta_box('postimagediv', $metabox['page'], 'side');
			add_meta_box('postimagediv', __('Fallback Graph Image'), 'post_thumbnail_meta_box', $metabox['page'], 'normal', 'high');
			
			parent::register_metaboxes();
		}
		
		
} // END class 


?>