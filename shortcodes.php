<?php


/**
 * Create a javascript slideshow of each top level element in the
 * shortcode.  All attributes are optional, but may default to less than ideal
 * values.  Available attributes:
 * 
 * height     => css height of the outputted slideshow, ex. height="100px"
 * width      => css width of the outputted slideshow, ex. width="100%"
 * transition => length of transition in milliseconds, ex. transition="1000"
 * cycle      => length of each cycle in milliseconds, ex cycle="5000"
 * animation  => The animation type, one of: 'slide' or 'fade'
 *
 * Example:
 * [slideshow height="500px" transition="500" cycle="2000"]
 * <img src="http://some.image.com" .../>
 * <div class="robots">Robots are coming!</div>
 * <p>I'm a slide!</p>
 * [/slideshow]
 **/
function sc_slideshow($attr, $content=null){
	$content = cleanup(str_replace('<br />', '', $content));
	$content = DOMDocument::loadHTML($content);
	$html    = $content->childNodes->item(1);
	$body    = $html->childNodes->item(0);
	$content = $body->childNodes;
	
	# Find top level elements and add appropriate class
	$items = array();
	foreach($content as $item){
		if ($item->nodeName != '#text'){
			$classes   = explode(' ', $item->getAttribute('class'));
			$classes[] = 'slide';
			$item->setAttribute('class', implode(' ', $classes));
			$items[] = $item->ownerDocument->saveXML($item);
		}
	}
	
	$animation = ($attr['animation']) ? $attr['animation'] : 'slide';
	$height    = ($attr['height']) ? $attr['height'] : '100px';
	$width     = ($attr['width']) ? $attr['width'] : '100%';
	$tran_len  = ($attr['transition']) ? $attr['transition'] : 1000;
	$cycle_len = ($attr['cycle']) ? $attr['cycle'] : 5000;
	
	ob_start();
	?>
	<div 
		class="slideshow <?=$animation?>"
		data-tranlen="<?=$tran_len?>"
		data-cyclelen="<?=$cycle_len?>"
		style="height: <?=$height?>; width: <?=$width?>;"
	>
		<?php foreach($items as $item):?>
		<?=$item?>
		<?php endforeach;?>
	</div>
	<?php
	$html = ob_get_clean();
	
	return $html;
}
add_shortcode('slideshow', 'sc_slideshow');


function sc_search_form() {
	ob_start();
	?>
	<div class="search">
		<?get_search_form()?>
	</div>
	<?
	return ob_get_clean();
}
add_shortcode('search_form', 'sc_search_form');

function rgraph_shortcode($attr, $content=null) {
	$graphID = $attr['id'];
	if ($graphID == '') { return ''; }
	
	$graph = get_post($graphID);
	if (get_post_type($graph) !== 'graph') { return 'This post is not a graph!'; }
	
	$graph_dimensions = explode("x", strtolower(get_post_meta($graphID,'graph_dimensions',TRUE)));
	$graph_w = $graph_dimensions[0];
	$graph_h = $graph_dimensions[1];
	
	ob_start();
	?>
		<div class="rgraph_canvas_wrap" id="rgraph<?=$graphID?>_wrap">
			<canvas id="rgraph<?=$graphID?>" width="<?=$graph_w?>" height="<?=$graph_h?>">
			<?php 
			$fallback_img = get_the_post_thumbnail($graphID,array($graph_w,$graph_h)); 
			if ($fallback_img) { ?>
				<?=$fallback_img?>
			<?php } else { print "<p style='font-weight:bold; text-align:center; color: #666'>Your browser cannot display the HTML5 canvas element.  Please upgrade your browser to view this graph.</p>"; } ?>
			</canvas>
		</div>
	<?php
	return ob_get_clean();
}
add_shortcode('rgraph','rgraph_shortcode');

?>