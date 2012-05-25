<?php
//  0:  Create new classes 'SingleBar/Line/PieGraph' and set up default parameters
//  1:  Check for any canvas elements on the page with an id starting with "rgraph",
//		explode each name and remove the "rgraph" portion of the name,
//		then re-store these elements (now the Post ID) as new SingleBar/Line/PieGraph objects.  
//		We'll use the Post ID to retrieve chart data for each chart.
//  2:  For each SingleBar/Line/PieGraph object, set up and output the necessary javascript
//		for the chart to work correctly.


//Search content for canvases:
global $wp_query;

//Create class:
class SingleGraph {
	public
		$graphID 			= NULL,
		$graphType			= NULL,
		$data				= array(),
		$dataLabels			= array(),
		$dataColors			= array(),
		$animation			= NULL,
		$graphkey			= FALSE,
		$tooltips			= FALSE,
		$title_h			= NULL,
		$title_v			= NULL,
		$labels_h			= array(),
		$labels_v			= array(),
		$gridLines_h		= NULL,
		$gridLines_v		= NULL,
		$axesOff			= FALSE,
		$units_pre			= NULL,
		$units_post			= NULL;
	
	public function parseData() {
		//Data parsing:
		foreach ($this->data as $dataGroup) {
			$dataGroup = "[".$dataGroup."],";
		}
		//Label parsing:
		foreach ($this->dataLabels as $dataLabel) {
			$dataLabel = "'".$dataLabel."',";	
		}
		//Color parsing:
		foreach ($this->dataColors as $dataColor) {
			$dataColor = "'".$dataColor."',";	
		}
		//Horizontal Label parsing:
		foreach ($this->labels_h as $labelH) {
			$labelH = "'".$labelH."',";	
		}
		//Vertical Label parsing:
		foreach ($this->labels_v as $labelV) {
			if (count($labelV) > 1) {
				$labelV = "'".$labelV."',";	
			}
		}
	}
}

global $wp_query;
$current_page = $wp_query->post->post_content;
//Debug:
print "Var dump of page content:  ";
var_dump($current_page);
print "<br/>";

$all_graphs = array();

preg_match_all('/[rgraph id="[0-9]+/', $current_page, $graphs);
//Debug:
print "Var dump of shortcode matches stored in $ graphs:  ";
var_dump($graphs);
print "<br /><br />";

if (count($graphs) > 0) {
	$j = 1;
	foreach ($graphs as $graphShortcode) {
		print "Shortcode match count: ".count($graphShortcode)."<br/>";
		foreach ($graphShortcode as $graph) {
			$graphPostID = explode("id=\"", $graph);  //Explode the contents of $graph so we can get the ID
			$graphPostID = $graphPostID[1];
			print "Graph ID: ".$graphPostID.",<br/>";
			$graph = get_post($graphPostID);		//Use the ID as the post ID for get_post()
			$graphClass = new SingleGraph;
			$graphClass->graphID 			= $graph->ID;
			$graphClass->graphType			= get_post_meta($graphClass->graphID,'graph_graphtype',TRUE);
			$graphClass->data				= explode("|",get_post_meta($graph->ID,'graph_data',TRUE));
			$graphClass->dataLabels			= explode("|",get_post_meta($graph->ID,'graph_datalabels',TRUE));
			$graphClass->dataColors			= explode("|",get_post_meta($graph->ID,'graph_datacolors',TRUE));
			$graphClass->animation			= get_post_meta($graph->ID,'graph_animation',TRUE);
			$graphClass->graphkey			= get_post_meta($graph->ID,'graph_key',TRUE);
			$graphClass->tooltips			= get_post_meta($graph->ID,'graph_tooltips',TRUE);
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
	//Debug:
	print "all_graphs contents, after foreach loop: ";
	print_r($all_graphs);
	print "<br/><br/>";
	print "Retrieval of all_graphs objects from array:";
	foreach($all_graphs as $object) {
		print $object->graphType;
		print $object->tooltips;
	}
}
else { print "No match"; }

print "Results output: <br/>";


//Begin javascript output:
$results = header('Content-type: text/javascript')."
	if (typeof jQuery != 'undefined'){
		jQuery(document).ready(function($) {
			";
			
foreach ($all_graphs as $object) {
	$rgraphObject = "rgraph".$object->graphID;
		
	//Create new Graph object:
		
	$results .= "var ".$rgraphObject." = new RGraph.".$object->graphType."('".$rgraphObject."',";
	foreach ($object->data as $dataGroup) {
		$results .= $dataGroup;
	}
	$results .= ");";
	//Prints var rgraphxxx = new RGraph.Line('rgraphxxx', [datagroup], [datagroup], ...);
		
		
	//Set Graph parameters:
		
	//Colors
	$results .= $rgraphObject.".Set('chart.colors', [";
	foreach ($object->dataColors as $dataColor) {
		$results .= $dataColor;	
	}
	$results .= "]);";
	
	//Graph key
	if ($object->graphkey == true) {
		$results .= $rgraphObject.".Set('chart.key', ";
		foreach ($object->dataLabels as $dataLabel) {
			$results .= $dataLabel;	
		}
		$results .= ");";
	}
		
	//Add tooltips here --tooltips require an array of strings; need to re-format $object->data to output strings instead of numbers
		
	//Horizontal Title
	if ($object->title_h) {
		$results .= $rgraphObject.".Set('chart.title.xaxis', ".$object->title_h.");";
	}
	//Vertical Title
	if ($object->title_v) {
		$results .= $rgraphObject.".Set('chart.title.yaxis', ".$object->title_v.");";
	}
	//Horizontal Labels
	$results .= $rgraphObject.".Set('chart.labels', [";
	foreach ($object->labels_h as $labelH) {
		$results .= $labelH;	
	}
	$results .= "]);";
	//Vertical Labels
	if ($object->labels_v) {
		$results .= $rgraphObject.".Set('chart.ylabels.specific', ";
		foreach ($object->labels_v as $labelV) {
			$results .= $labelV;	
		}
		$results .= ");";
	}
	
	$results .= $rgraphObject.".Set('chart.background.grid.autofit', true);";
	
	//Number of horizontal gridlines
	if ($object->gridLines_h) {
		$results .= $rgraphObject.".Set('chart.background.grid.autofit.numhlines', ".$object->gridLines_h.");";
	}
	//Number of vertical gridlines
	if ($object->gridLines_v) {
		$results .= $rgraphObject.".Set('chart.background.grid.autofit.numvlines', ".$object->gridLines_v.");";
	}
	//Axes on/off
	if ($object->axesOff == true) {
		$results .= $rgraphObject.".Set('chart.noaxes', true)";
	}
	//Units (pre)
	if ($object->units_pre) {
		$results .= $rgraphObject."Set('chart.units.pre', '".$object->units_pre."');";
	}
	//Units (post)
	if ($object->units_post) {
		$results .= $rgraphObject."Set('chart.units.post', '".$object->units_post."');";
	}
	
	//Draw method --Need to add case for animated draw methods!
	
	$results .= $rgraphObject.".Draw();";
}

$results .= "}); }else{console.log('jQuery dependancy failed to load');} ";


//Create a new Javascript document (replace if it already exists) and array_push it into the main javascript parsing array 
//Merge the new document as docname.js.php

$rgraphJS = THEME_INCLUDES_DIR."/rgraph-js.js";
$rgraphJSHandle = fopen($rgraphJS, 'w') or die("can't open file"); //If file exists, create it; otherwise write over what's already there.
fwrite($rgraphJSHandle, $results);
fclose($rgraphJSHandle);

?>