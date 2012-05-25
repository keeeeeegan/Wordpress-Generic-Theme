<?php
//  0:  Create new classes 'SingleGraph' and set up default parameters
//  1:  Check for any canvas elements on the page with an id starting with "rgraph",
//		explode each name and remove the "rgraph" portion of the name,
//		then re-store these elements (now the Post ID) as new SingleGraph objects.  
//		We'll use the Post ID to retrieve chart data for each chart.
//  2:  For each SingleGraph object, set up and output the necessary javascript
//		for the chart to work correctly.


//Search content for canvases:
global $wp_query;

//Create class:
class SingleGraph {
	public
		$graphID 			= NULL,
		$graphType			= NULL,
		$gutter_t			= NULL,
		$gutter_r			= NULL,
		$gutter_b			= NULL,
		$gutter_l			= NULL,
		$data				= array(),
		$dataLabels			= array(),
		$dataColors			= array(),
		$animation			= NULL,
		$graphkey			= FALSE,
		$tooltips			= FALSE,
		$tickmarks			= FALSE,
		$lineWidth			= NULL,
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

global $wp_query; 		//Necessary call to retrieve the current post's content
$all_graphs = array(); 	//Start an empty array for storing SingleGraph instances
$current_page = $wp_query->post->post_content;
preg_match_all('/[rgraph id="[0-9]+/', $current_page, $graphs);	 //Search for shortcode output within the page's content

//Debug:
/*
print "Var dump of page content:  ";
var_dump($current_page);
print "<br/>";
*/

//Debug:
/*
print "Var dump of shortcode matches stored in $ graphs:  ";
var_dump($graphs);
print "<br /><br />";
*/

if (count($graphs) > 0) {
	$j = 1;
	foreach ($graphs as $graphShortcode) {
		/*print "Shortcode match count: ".count($graphShortcode)."<br/>";*/
		foreach ($graphShortcode as $graph) {
			$graphPostID = explode("id=\"", $graph);  //Explode the contents of $graph so we can get the ID
			$graphPostID = $graphPostID[1];
			/*print "Graph ID: ".$graphPostID.",<br/>";*/
			$graph = get_post($graphPostID);		//Use the ID as the post ID for get_post()
			$graphClass = new SingleGraph;
			$graphClass->graphID 			= $graph->ID;
			$graphClass->graphType			= get_post_meta($graphClass->graphID,'graph_graphtype',TRUE);
			$graphClass->gutter_t			= get_post_meta($graphClass->graphID,'graph_gutter_top',TRUE);
			$graphClass->gutter_r			= get_post_meta($graphClass->graphID,'graph_gutter_right',TRUE);
			$graphClass->gutter_b			= get_post_meta($graphClass->graphID,'graph_gutter_bottom',TRUE);
			$graphClass->gutter_l			= get_post_meta($graphClass->graphID,'graph_gutter_left',TRUE);
			$graphClass->data				= explode("|",get_post_meta($graph->ID,'graph_data',TRUE));
			$graphClass->dataLabels			= explode("|",get_post_meta($graph->ID,'graph_datalabels',TRUE));
			$graphClass->dataColors			= explode("|",get_post_meta($graph->ID,'graph_datacolors',TRUE));
			$graphClass->animation			= get_post_meta($graph->ID,'graph_animation',TRUE);
			$graphClass->graphkey			= get_post_meta($graph->ID,'graph_key',TRUE);
			$graphClass->tooltips			= get_post_meta($graph->ID,'graph_tooltips',TRUE);
			$graphClass->lineWidth			= get_post_meta($graph->ID,'graph_line_width',TRUE);
			$graphClass->tickmarks			= get_post_meta($graph->ID,'graph_tickmarks',TRUE);
			$graphClass->title_h			= get_post_meta($graph->ID,'graph_title_h',TRUE);
			$graphClass->title_v			= get_post_meta($graph->ID,'graph_title_v',TRUE);
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
	
	//Debugging output:
	
	print "all_graphs contents, after foreach loop: ";
	print_r($all_graphs);
	print "<br/><br/>";
	print "Retrieval of all_graphs objects from array: ";
	foreach($all_graphs as $object) {
		print $object->graphType."<br/>";
		print $object->tooltips."<br/>";
		print "Data group count:  ".count($object->data)."<br/>";
	}
	
}
/*else { print "No match"; }*/


//Begin javascript output:
$results = header('Content-type: text/javascript')."
	if (typeof jQuery != 'undefined'){
		jQuery(document).ready(function($) {
			";
			
foreach ($all_graphs as $object) {
	$rgraphObject = "rgraph".$object->graphID;
		
	//Create new Graph object:
	$results .= "var ".$rgraphObject." = new RGraph.".$object->graphType."('".$rgraphObject."',";
	$dataString = "";
	foreach ($object->data as $dataGroup) {
		$dataGroup = "[".$dataGroup."],";
		$dataString .= $dataGroup;
	}
	$dataString .= ");";
	$dataString = str_replace(",);", ");", $dataString);
	$results .= $dataString."\n";
			
		
	//Set Graph parameters:
	
	//Basic default values
	$results .= $rgraphObject.".Set('chart.background.grid.autofit', true); \n";
	$results .= $rgraphObject.".Set('chart.text.font', 'Helvetica'); \n \n";
		
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
		
	//Add tooltips here --tooltips require an array of strings; need to re-format $object->data to output strings instead of numbers
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
	if ($object->graphType == "Line" && $object->tickmarks) {
		$results .= $rgraphObject.".Set('chart.tickmarks', 'circle'); \n";
	}
	//Add line width for line graphs only	
	if ($object->graphType == "Line" && $object->lineWidth) {
		$results .= $rgraphObject.".Set('chart.linewidth', ".$object->lineWidth."); \n";
	}
		
	//Horizontal Title
	if ($object->title_h) {
		$results .= $rgraphObject.".Set('chart.title.xaxis', '".$object->title_h."'); \n";
	}
	//Vertical Title
	if ($object->title_v) {
		$results .= $rgraphObject.".Set('chart.title.yaxis', '".$object->title_v."'); \n";
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
		else {
			$results .= $rgraphObject.".Set('chart.background.grid.autofit.numhlines', ".$object->gridLines_v."); \n";
		}
	}
	//Number of vertical gridlines
	if ($object->gridLines_v) {
		if ($object->gridLines_v == "none") {
			$results .= $rgraphObject.".Set('chart.background.grid.autofit.numvlines', 0); \n";
		}
		else {
			$results .= $rgraphObject.".Set('chart.background.grid.autofit.numvlines', ".$object->gridLines_v."); \n";
		}
	}
	//Axes on/off
	if ($object->axesOff == true) {
		$results .= $rgraphObject.".Set('chart.noaxes', true); \n";
	}
	//Units (pre)
	if ($object->units_pre) {
		$results .= $rgraphObject.".Set('chart.units.pre', '".$object->units_pre."'); \n";
	}
	//Units (post)
	if ($object->units_post) {
		$results .= $rgraphObject.".Set('chart.units.post', '".$object->units_post."'); \n";
	}
	
	//Draw method --Need to add case for animated draw methods!
	$results .= $rgraphObject.".Draw(); \n \n";
}

$results .= "}); }else{console.log('jQuery dependency failed to load for RGraph execution');} ";


//Create a new Javascript document (replace if it already exists) and array_push it into the main javascript parsing array

$rgraphJS = THEME_INCLUDES_DIR."/rgraph-js.js";
$rgraphJSHandle = fopen($rgraphJS, 'w') or die("can't open file"); //If file exists, create it; otherwise write over what's already there.
fwrite($rgraphJSHandle, $results);
fclose($rgraphJSHandle);

?>