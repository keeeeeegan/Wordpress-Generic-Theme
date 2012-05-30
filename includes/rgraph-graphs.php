<?php
//  0:  Create new class 'SingleGraph' and set up default parameters
//  1:  Check for any canvas elements on the page with an id starting with "rgraph",
//		explode each name and remove the "rgraph" portion of the name,
//		then re-store these elements (now the Post ID) as new SingleGraph objects.
//		We'll use the Post ID to retrieve chart data/parameters for each chart.
//  2:  For each SingleGraph object, set up and output the necessary javascript
//		for the chart to output correctly.

//0:  Create class 'SingleGraph'

class SingleGraph {
	public
		$graphID 			= NULL,
		$graphDimensions 	= array(),
		$graphTitle			= NULL,
		$graphType			= NULL,
		$gutter_t			= NULL,
		$gutter_r			= NULL,
		$gutter_b			= NULL,
		$gutter_l			= NULL,
		$data				= array(),
		$dataLabels			= array(),
		$dataColors			= array(),
		$animation			= NULL,
		$animation_onLoad	= FALSE,
		$graphkey			= FALSE,
		$tooltips			= FALSE,
		$tickmarks			= FALSE,
		$lineWidth			= NULL,
		$graphTitleOff		= NULL,
		$graphTitle_pos_v	= NULL,
		$title_pos_h		= NULL,
		$title_pos_v		= NULL,
		$title_h			= NULL,
		$title_v			= NULL,
		$labels_h			= array(),
		$labels_v			= array(),
		$gridLines_h		= NULL,
		$gridLines_v		= NULL,
		$axesOff			= FALSE,
		$units_pre			= NULL,
		$units_post			= NULL;
}


//1:  Get page content, search for graphs and make new SingleGraph instances.

global $wp_query; 		//Necessary call to retrieve the current post's content
$all_graphs = array(); 	//Start an empty array for storing SingleGraph instances
$current_page = $wp_query->post->post_content;
preg_match_all('/\[rgraph id="[0-9]+/', $current_page, $graphs);	 //Search for shortcode output within the page's content

if (count($graphs) > 0) {
	$j = 1;
	foreach ($graphs as $graphShortcode) {
		foreach ($graphShortcode as $graph) {
			$graphPostID = explode("id=\"", $graph);  //Explode the contents of $graph so we can get the ID
			$graphPostID = $graphPostID[1];
			$graph = get_post($graphPostID);		//Use the ID as the post ID for get_post()
			$graphClass = new SingleGraph;
			$graphClass->graphID 			= $graph->ID;
			$graphClass->graphDimensions	= explode("x", strtolower(get_post_meta($graph->ID,'graph_dimensions',TRUE)));
			$graphClass->graphTitle			= get_the_title($graphClass->graphID);
			$graphClass->graphType			= get_post_meta($graphClass->graphID,'graph_graphtype',TRUE);
			$graphClass->gutter_t			= get_post_meta($graphClass->graphID,'graph_gutter_top',TRUE);
			$graphClass->gutter_r			= get_post_meta($graphClass->graphID,'graph_gutter_right',TRUE);
			$graphClass->gutter_b			= get_post_meta($graphClass->graphID,'graph_gutter_bottom',TRUE);
			$graphClass->gutter_l			= get_post_meta($graphClass->graphID,'graph_gutter_left',TRUE);
			$graphClass->data				= explode("|",get_post_meta($graph->ID,'graph_data',TRUE));
			$graphClass->dataLabels			= explode("|",get_post_meta($graph->ID,'graph_datalabels',TRUE));
			$graphClass->dataColors			= explode("|",get_post_meta($graph->ID,'graph_datacolors',TRUE));
			$graphClass->animation			= get_post_meta($graph->ID,'graph_animation',TRUE);
			$graphClass->animation_onLoad	= get_post_meta($graph->ID,'graph_animation_onload',TRUE);
			$graphClass->graphkey			= get_post_meta($graph->ID,'graph_key',TRUE);
			$graphClass->tooltips			= get_post_meta($graph->ID,'graph_tooltips',TRUE);
			$graphClass->lineWidth			= get_post_meta($graph->ID,'graph_line_width',TRUE);
			$graphClass->tickmarks			= get_post_meta($graph->ID,'graph_tickmarks',TRUE);
			$graphClass->graphTitleOff		= get_post_meta($graphClass->graphID,'graph_graphtitle_off',TRUE);
			$graphClass->graphTitle_pos_v	= get_post_meta($graph->ID,'graph_graphtitle_pos_v',TRUE);
			$graphClass->title_h			= get_post_meta($graph->ID,'graph_title_h',TRUE);
			$graphClass->title_v			= get_post_meta($graph->ID,'graph_title_v',TRUE);
			$graphClass->title_pos_h		= get_post_meta($graph->ID,'graph_title_pos_h',TRUE);
			$graphClass->title_pos_v		= get_post_meta($graph->ID,'graph_title_pos_v',TRUE);
			$graphClass->labels_h			= explode("|",get_post_meta($graph->ID,'graph_labels_h',TRUE));
			$graphClass->labels_v			= explode("|",get_post_meta($graph->ID,'graph_labels_v',TRUE));
			$graphClass->gridLines_h		= get_post_meta($graph->ID,'graph_gridlines_h',TRUE);
			$graphClass->gridLines_v		= get_post_meta($graph->ID,'graph_gridlines_v',TRUE);
			$graphClass->axesOff			= get_post_meta($graph->ID,'graph_axes_off',TRUE);
			$graphClass->units_pre			= get_post_meta($graph->ID,'graph_units_pre',TRUE);
			$graphClass->units_post			= get_post_meta($graph->ID,'graph_units_post',TRUE);
			array_push($all_graphs, $graphClass);
			$j++;
		}
	}
}


//2:  Begin javascript output

$results = "
	if (typeof jQuery != 'undefined'){
		jQuery(document).ready(function($) {
			";
			
foreach ($all_graphs as $object) {
	$rgraphObject = "rgraph".$object->graphID;
		
	//Create new Graph object:
	$results .= "var ".$rgraphObject." = new RGraph.".$object->graphType."('".$rgraphObject."',";
	if (count($object->data) > 1) { //If more than one data set exists, they need to all be grouped within a bracket set "[ ]"
		$dataString = "[";
		foreach ($object->data as $dataGroup) {
			$dataGroup = "[".$dataGroup."],";
			$dataString .= $dataGroup;
		}
		$dataString .= "]);";
		$dataString = str_replace(",]);", "]);", $dataString);
	}
	else { //If it's just one data set, we only use the single containing brackets
		$dataString = "";
		foreach ($object->data as $dataGroup) {
			$dataGroup = "[".$dataGroup."],";
			$dataString .= $dataGroup;
		}
		$dataString .= ");";
		$dataString = str_replace(",);", ");", $dataString);
	}
	$results .= $dataString."\n";
			
		
	//Set Graph parameters:
	
	//Basic default values
	$results .= $rgraphObject.".Set('chart.background.grid.autofit', true); \n";
	$results .= $rgraphObject.".Set('chart.text.font', 'Helvetica'); \n";
	$results .= $rgraphObject.".Set('chart.title.vpos', 0.2); \n"; //Setting this by default as most graphs seem to need the extra spacing
	$results .= $rgraphObject.".Set('chart.title.size', 14); \n";
		
	//Gutters
	if ($object->gutter_t) {
		$results .= $rgraphObject.".Set('chart.gutter.top', ".$object->gutter_t."); \n";
	}
	if ($object->gutter_r) {
		$results .= $rgraphObject.".Set('chart.gutter.right', ".$object->gutter_r."); \n";
	}
	if ($object->gutter_b) {
		$results .= $rgraphObject.".Set('chart.gutter.bottom', ".$object->gutter_b."); \n";
	}
	if ($object->gutter_l) {
		$results .= $rgraphObject.".Set('chart.gutter.left', ".$object->gutter_l."); \n";
	}
	
	//Main chart title and vertical positioning
	if ($object->graphTitleOff == NULL) {
		$results .= $rgraphObject.".Set('chart.title', '".$object->graphTitle."'); \n";
		if ($object->graphTitle_pos_v) {
			$results .= $rgraphObject.".Set('chart.title.vpos', '".$object->graphTitle_pos_v."'); \n";
		}
	}
		
	//Colors
	if ($object->dataColors[0]) {
		$results .= $rgraphObject.".Set('chart.colors', ";
		$colorString = "[";
		foreach ($object->dataColors as $color) {
			$colorString .= "'".$color."',";
		}
		$colorString .= "]);";
		$colorString = str_replace(",]);", "]);", $colorString);
		$results .= $colorString."\n";
	}
	
	//Graph key
	if ($object->graphkey) {
		$results .= $rgraphObject.".Set('chart.key', ";
		$labelString = "[";
		foreach ($object->dataLabels as $dataLabel) {
			if ($dataLabel) {
				$labelString .= "'".$dataLabel."',";
			}
			else { $labelString .= ""; }
		}
		$labelString .= "]);";
		$labelString = str_replace(",]);", "]);", $labelString);
		$results .= $labelString."\n";
		//We're also turning on key interactivity for Line graphs and Pie graphs if the key itself is activated
		if ($object->graphType == "Line" | $object->graphType == "Pie") {
			$results .= $rgraphObject.".Set('chart.key.interactive', true); \n";
		}
	}
		
	//Tooltips
	if ($object->tooltips) {
		$results .= $rgraphObject.".Set('chart.tooltips', ";
		$tooltipString = "['";			
		foreach ($object->data as $dataGroup) {
			$dataGroup = str_replace(",","','",$dataGroup);
			$tooltipString .= $dataGroup."','";
		}
		$tooltipString .= "]);";
		$tooltipString = str_replace("]);", "']);", $tooltipString); //Make sure the list ends with an apostrophe
		$tooltipString = str_replace("''", "", $tooltipString);		 //Remove any empty sets of data
		$tooltipString = str_replace(",]);", "]);", $tooltipString); //Remove stray commas from end of list
		$results .= $tooltipString."\n";
	}
	
	//Add tickmarks for line graphs only
	if ($object->graphType == "Line" && $object->tickmarks) { $results .= $rgraphObject.".Set('chart.tickmarks', 'circle'); \n"; }
	
	//Add line width for line graphs only	
	if ($object->graphType == "Line" && $object->lineWidth) { $results .= $rgraphObject.".Set('chart.linewidth', ".$object->lineWidth."); \n"; }
		
	//Horizontal Title and positioning
	if ($object->title_h) {
		$results .= $rgraphObject.".Set('chart.title.xaxis', '".$object->title_h."'); \n";
		if ($object->title_pos_h) {
			$results .= $rgraphObject.".Set('chart.title.xaxis.pos', ".$object->title_pos_h."); \n";
		}
	}
	//Vertical Title and positioning
	if ($object->title_v) {
		$results .= $rgraphObject.".Set('chart.title.yaxis', '".$object->title_v."'); \n";
		if ($object->title_pos_v) {
			$results .= $rgraphObject.".Set('chart.title.yaxis.pos', ".$object->title_pos_v."); \n";
		}
	}
	
	//Horizontal Labels
	$results .= $rgraphObject.".Set('chart.labels', ";
	$labelHString = "[";
	if ($object->graphType !== "Pie") {
		foreach ($object->labels_h as $labelH) {
			$labelHString .= "'".$labelH."',";	
		}
		$labelHString .= "]);";
		$labelHString = str_replace(",]);", "]);", $labelHString);
		$results .= $labelHString."\n";
	}
	else { //Need to use data labels for Pie charts:
		foreach ($object->dataLabels as $dataLabel) {
			$labelHString .= "'".$dataLabel."',";	
		}
		$labelHString .= "]);";
		$labelHString = str_replace(",]);", "]);", $labelHString);
		$results .= $labelHString."\n";
	}
	//Vertical Labels
	if ($object->labels_v[0]) {
		$labelVString = "";
		$results .= $rgraphObject.".Set('chart.ylabels.specific', [";
		foreach ($object->labels_v as $labelV) {
			$labelVString .= "'".$labelV."',";	
		}
		$labelVString .= "]);";
		$labelVString = str_replace(",]);", "]);", $labelVString);
		$results .= $labelVString."\n";
	}
	
	//Number of horizontal gridlines
	if ($object->gridLines_h) {
		if ($object->gridLines_h == "none") {
			$results .= $rgraphObject.".Set('chart.background.grid.autofit.numhlines', 0); \n";
		}
		else { $results .= $rgraphObject.".Set('chart.background.grid.autofit.numhlines', ".$object->gridLines_v."); \n"; }
	}
	//Number of vertical gridlines
	if ($object->gridLines_v) {
		if ($object->gridLines_v == "none") {
			$results .= $rgraphObject.".Set('chart.background.grid.autofit.numvlines', 0); \n";
		}
		else { $results .= $rgraphObject.".Set('chart.background.grid.autofit.numvlines', ".$object->gridLines_v."); \n"; }
	}
	//Axes on/off
	if ($object->axesOff == true) { $results .= $rgraphObject.".Set('chart.noaxes', true); \n"; }
	
	//Units (pre)
	if ($object->units_pre) { $results .= $rgraphObject.".Set('chart.units.pre', '".$object->units_pre."'); \n"; }
	
	//Units (post)
	if ($object->units_post) { $results .= $rgraphObject.".Set('chart.units.post', '".$object->units_post."'); \n"; }
	
	//Draw/Animate method
	if ($object->animation && $object->animation !== "empty") {
		if ($object->animation_onLoad == true) {
			$results .= "RGraph.".$object->animation."(".$rgraphObject."); \n \n ";
		}
		else {
			$results .= "$('canvas#".$rgraphObject."').bind('inview', function (event, visible) {
							if (visible == true) { 
								RGraph.".$object->animation."(".$rgraphObject.");
							} else { 
								$('canvas#".$rgraphObject."').unbind('inview');
							}
						}); \n \n";
		}
	}
	else { $results .= $rgraphObject.".Draw(); \n \n"; }
	
	//ExCanvas initialization
	$results .= "
	if ( ($.browser.msie) && ($.browser.version < 9) ) {
		var canvasWrap = $('#".$rgraphObject."_wrap'); 
		var canvas 	   = document.createElement('canvas');
		canvas.attr('width', ".$object->graphDimensions[0].");
		canvas.attr('height', ".$object->graphDimensions[1].");
		canvasWrap.append(canvas);
		G_vmlCanvasManager.initElement(canvas);
		var ".$rgraphObject." = canvas.getContext('2d');
	}
	";
	
}
$results .= "}); }else{console.log('jQuery dependency failed to load for RGraph execution');} ";


//Create a new Javascript document (replace if it already exists).  This file is already included in Config::$scripts
$rgraphJS = THEME_INCLUDES_DIR."/rgraph-js.js";
$rgraphJSHandle = fopen($rgraphJS, 'w') or die("can't open file");
fwrite($rgraphJSHandle, $results);
fclose($rgraphJSHandle);

?>