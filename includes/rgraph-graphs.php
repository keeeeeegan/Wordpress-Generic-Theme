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
	
	public function writeBarJS() {
		print "";
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
	
	public function writeLineJS() {
		print "
			";
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
	
	public function writePieJS() {
		print "";
	}
}

global $wp_query;
$current_page = $wp_query->post->post_content;
var_dump($current_page);

if(preg_match('/rgraph id="[0-9]+/', $current_page, $graphs)) { //Can't find $post->content!
	print "Match found";
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
else { print "No match"; }


//Set up empty $js variable for the classes to use to store javascript output:
//

$js = header('Content-type: text/javascript')."
	if (typeof jQuery != 'undefined'){
		jQuery(document).ready(function($) {
			
				var e_ucf = [27684,28685,30206,31673,33713,35850,38501,41535,42465,44856,47226,48897,50181,53472,56236,58587];
				var e_uf  = [39863,41713,42336,43382,45114,46515,47373,47858,47993,49693,50912,51725,51475,50691,49827,49589];
				var e_usf = [36266,34036,33654,34839,35561,37221,38854,40945,42238,42660,41799,44869,46174,47122,49074,48574];
				var e_fsu = [30154,30401,31071,32878,33971,34982,36210,36884,38431,39146,39973,40555,38717,39785,40416,41087];
				var e_fiu = [29720,30012,30421,31293,31945,31727,33349,33228,34865,36904,38097,38290,34159,38208,40841,43831];
				var rgraph142 = new RGraph.Line('rgraph142', e_fiu, e_fsu, e_usf, e_uf, e_ucf);
				rgraph142.Set('chart.background.grid', false);
				rgraph142.Set('chart.linewidth', 12);
				rgraph142.Set('chart.gutter.left', 70);
				rgraph142.Set('chart.gutter.right',105);
				rgraph142.Set('chart.gutter.top',30);
				rgraph142.Set('chart.gutter.bottom',70);			
				rgraph142.Set('chart.hmargin', 5);
				rgraph142.Set('chart.tickmarks', null);
				rgraph142.Set('chart.units.post', '');
				rgraph142.Set('chart.ylabels', false);
				rgraph142.Set('chart.ymin',20000);
				rgraph142.Set('chart.ymax',58587);
				rgraph142.Set('chart.colors', ['#0b75bc', '#bf1e2e', '#0ca14d', '#f1592a', '#ffc907']);
				rgraph142.Set('chart.background.grid.border', false);
				rgraph142.Set('chart.background.grid.autofit', true);
				rgraph142.Set('chart.background.grid.autofit.numhlines', 0);
				rgraph142.Set('chart.background.grid.vlines',false);
				rgraph142.Set('chart.curvy', 0);
				rgraph142.Set('chart.noaxes', true);
				
				if (!document.all || RGraph.isIE9up()) {
					rgraph142.Set('chart.shadow', false);
				}
				
				$('canvas#rgraph142').bind('inview', function (event, visible) {
					if (visible == true) {
						RGraph.Effects.Line.jQuery.Trace(rgraph142); /* Line animation */
						$('img#enrollment_gradient').delay(600).fadeIn(1100); /* Fade in the gradient fill afterward */
					} else {
						$('canvas#rgraph142').unbind('inview');
					}
				});
			
		});
	}else{console.log('jQuery dependancy failed to load');}
	";

//Create a new Javascript document (replace if it already exists) and array_push it into the main javascript parsing array 
//Merge the new document as docname.js.php

$rgraphJS = THEME_INCLUDES_DIR."/rgraph-js.js";
$rgraphJSHandle = fopen($rgraphJS, 'w') or die("can't open file"); //If file exists, create it; otherwise write over what's already there.
fwrite($rgraphJSHandle, $js);
fclose($rgraphJSHandle);

//array_push(Config::$scripts, array('name' => 'rgraph-js', 'src' => THEME_URL.'/includes/rgraph-js.js.php'));
/*function enqueueGraphScript() {
	wp_register_script('rgraphJS', THEME_URL.'/includes/rgraph-js.js.php');
	wp_enqueue_script('rgraphJS');	
}
add_action('wp_enqueue_scripts', 'enqueueGraphScript');
*/
//print "<script type='text/javascript' src='".THEME_URL."/includes/rgraph-js.js.php'></script>";

?>