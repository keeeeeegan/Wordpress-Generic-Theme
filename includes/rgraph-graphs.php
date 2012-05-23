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

//Create classes per type of graph:
class SingleBarGraph {
	public
		$graphID 			= NULL,
		$graphDimensions_w	= NULL,
		$graphDimensions_h	= NULL,
		$data				= array(),
		$dataLabels			= array(),
		$dataColors			= array(),
		$animation			= NULL,
		$key				= FALSE,
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
	
	public function parseBarData() {
		
	}
}
class SingleLineGraph {
	public
		$graphID 			= NULL,
		$graphDimensions_w	= NULL,
		$graphDimensions_h	= NULL,
		$data				= array(),
		$dataLabels			= array(),
		$dataColors			= array(),
		$animation			= NULL,
		$key				= FALSE,
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
	public function parseLineData() {
		
	}
}
class SinglePieGraph {
	public
		$graphID 			= NULL,
		$graphDimensions_w	= NULL,
		$graphDimensions_h	= NULL,
		$data				= array(),
		$dataLabels			= array(),
		$dataColors			= array(),
		$animation			= NULL,
		$key				= FALSE,
		$tooltips			= FALSE;
	
	public function parsePieData() {
		
	}
}

if(preg_match('/rgraph id="[0-9]+$/', $post->content, $graphs)) {
	
	foreach ($graphs as $graph) {
		$graph = explode("id=\"", $graph);  //Explode the contents of $graph so we can get the ID
		$graph = get_post($graph[1]);		//Use the ID as the post ID for get_post()
		$graphType = get_post_meta($graph, 'graph_graphtype', TRUE);
		switch($graphType) {
			case 'bar':
				$graph = new SingleBarGraph;
				break;
			case 'line':
				$graph = new SingleLineGraph;
				break;
			case 'pie':
				$graph = new SinglePieGraph;
				break;
		}
	}

	
}

$printtest = print_r($graphs);

$js = <<<JS
alert('$printtest');
JS;

header("Content-type: text/javascript");
echo $js;
exit();
?>