<?php

/**
 * Using the user defined value for Flickr ID set in the admin, will return the
 * photostream URL for that ID.  Will return null if no id is set.
 *
 * @return string
 * @author Jared Lang
 * */
function get_flickr_feed_url() {
	$rss_url = 'http://api.flickr.com/services/feeds/photos_public.gne?id=%s&amp;lang=en-us&amp;format=rss_200';
	$options = get_option( THEME_OPTIONS_NAME );
	$id = $options['flickr_id'];

	if ( $id ) {
		return sprintf( $rss_url, $id );
	} else {
		return null;
	}
}


function get_flickr_stream_url() {
	$rss_url = 'http://flickr.com/photos/%s';
	$options = get_option( THEME_OPTIONS_NAME );
	$id = $options['flickr_id'];

	if ( $id ) {
		return sprintf( $rss_url, $id );
	} else {
		return null;
	}
}

function get_article_image( $article ) {
	$image = $article->get_enclosure();
	if ( $image ) {
		return ( $image->get_thumbnail() ) ? $image->get_thumbnail() : $image->get_link();
	}else {
		$matches = array();
		$found   = preg_match( '/<img[^>]+src=[\'\"]([^\'\"]+)[\'\"][^>]+>/i',  $article->get_content(), $matches );
		if ( $found ) {
			return $matches[1];
		}
	}
	return null;
}



/**
 * Handles fetching and processing of feeds.  Currently uses SimplePie to parse
 * retrieved feeds, and automatically handles caching of content fetches.
 * Multiple calls to the same feed url will not result in multiple parsings, per
 * request as they are stored in memory for later use.
 * */
class FeedManager {
	static private
	$feeds        = array(),
	$cache_length = 0xD2F0;

	/**
	 * Provided a URL, will return an array representing the feed item for that
	 * URL.  A feed item contains the content, url, simplepie object, and failure
	 * status for the URL passed.  Handles caching of content requests.
	 *
	 * @return array
	 * @author Jared Lang
	 * */
	static protected function __new_feed( $url ) {
		$timer = Timer::start();
		require_once ABSPATH . '/wp-includes/class-simplepie.php';

		$simplepie = null;
		$failed    = False;
		$cache_key = 'feedmanager-'.md5( $url );
		$content   = get_site_transient( $cache_key );

		if ( $content === False ) {
			$content = @file_get_contents( $url );
			if ( $content === False ) {
				$failed  = True;
				$content = null;
				error_log( 'FeedManager failed to fetch data using url of '.$url );
			} else {
				set_site_transient( $cache_key, $content, self::$cache_length );
			}
		}

		if ( $content ) {
			$simplepie = new SimplePie();
			$simplepie->set_raw_data( $content );
			$simplepie->init();
			$simplepie->handle_content_type();

			if ( $simplepie->error ) {
				error_log( $simplepie->error );
				$simplepie = null;
				$failed    = True;
			}
		}else {
			$failed = True;
		}

		$elapsed = round( $timer->elapsed() * 1000 );
		debug( '__new_feed: {$elapsed} milliseconds' );
		return array(
			'content'   => $content,
			'url'       => $url,
			'simplepie' => $simplepie,
			'failed'    => $failed,
		);
	}


	/**
	 * Returns all the items for a given feed defined by URL
	 *
	 * @return array
	 * @author Jared Lang
	 * */
	static protected function __get_items( $url ) {
		if ( !array_key_exists( $url, self::$feeds ) ) {
			self::$feeds[$url] = self::__new_feed( $url );
		}
		if ( !self::$feeds[$url]['failed'] ) {
			return self::$feeds[$url]['simplepie']->get_items();
		} else {
			return array();
		}

	}


	/**
	 * Retrieve the current cache expiration value.
	 *
	 * @return void
	 * @author Jared Lang
	 * */
	static public function get_cache_expiration() {
		return self::$cache_length;
	}


	/**
	 * Set the cache expiration length for all feeds from this manager.
	 *
	 * @return void
	 * @author Jared Lang
	 * */
	static public function set_cache_expiration( $expire ) {
		if ( is_number( $expire ) ) {
			self::$cache_length = (int)$expire;
		}
	}


	/**
	 * Returns all items from the feed defined by URL and limited by the start
	 * and limit arguments.
	 *
	 * @return array
	 * @author Jared Lang
	 * */
	static public function get_items( $url, $start=null, $limit=null ) {
		if ( $start === null ) {$start = 0;}

		$items = self::__get_items( $url );
		$items = array_slice( $items, $start, $limit );
		return $items;
	}
}


class FlickrManager extends FeedManager{
	static protected $sizes = array(
		'large'     => 'b',
		'medium'    => 'z',
		'small'     => 'm',
		'thumbnail' => 't',
		'square'    => 's',
	);

	static protected function __items_to_photos( $items ) {
		$photos = array();

		foreach ( $items as $item ) {
			$title = $item->get_title();
			$urls  = array();
			try {
				$url = $item->get_enclosure()->get_link();
			} catch ( Exception $e ) {
				continue;
			}

			foreach ( FlickrManager::$sizes as $key=>$size ) {
				$size             = '_' . $size . '.jpg';
				$urls[$key]       = str_replace( '_b.jpg', $size, $url );
				$urls['original'] = $url;
				$urls['title']    = $title;
				$urls['page']     = $item->get_link();
			}
			$photos[] = $urls;
		}
		return $photos;
	}


	static public function get_photos( $url, $start=null, $limit=null ) {
		if ( $start === null ) { $start = 0; }

		$items  = self::__get_items( $url );
		$photos = array_slice( self::__items_to_photos( $items ), $start, $limit );
		return $photos;
	}
}


function display_flickr( $header='h2' ) {
	$options  = get_option( THEME_OPTIONS_NAME );
	$count    = $options['flickr_max_items'];
	$feed_url = get_flickr_feed_url();
	$photos   = FlickrManager::get_photos( $feed_url, 0, $count );

	if ( count( $photos ) ):?>
		<<?php echo $header; ?>><a href="<?php echo get_flickr_stream_url(); ?>">Flickr Stream</a></<?php echo $header; ?>>
		<ul class="flickr-stream">
			<?php foreach ( $photos as $photo ):?>
			<li><a class="ignore-external" href="<?php echo $photo['page']?>"><img height="75" width="75" src="<?php echo $photo['square']; ?>" title="<?php echo $photo['title']; ?>"></a></li>
			<?php endforeach;?>
		</ul>
	<?php else: ?>
		<p>No photos found.</p>
	<?php endif;?>
<?php
}


function display_events( $header='h2' ) {
	$options = get_option( THEME_OPTIONS_NAME );
	$count   = $options['events_max_items'];
	$events  = get_events( 0, ( $count ) ? $count : 3 );
?>
	<?php if ( count( $events ) ):?>
		<<?php echo $header; ?>><a href="<?php echo $events[0]->get_feed()->get_link(); ?>"><?php echo $events[0]->get_feed()->get_title(); ?></a></<?php echo $header; ?>>
		<table class="events">
			<?php foreach ( $events as $item ):?>
			<tr class="item">
				<td class="date">
					<?php
					$month = $item->get_date( 'M' );
					$day   = $item->get_date( 'j' );
					?>
					<div class="month"><?php echo $month; ?></div>
					<div class="day"><?php echo $day; ?></div>
				</td>
				<td class="title">
					<a href="<?php echo $item->get_link(); ?>" class="wrap ignore-external"><?php echo $item->get_title(); ?></a>
				</td>
			</tr>
			<?php endforeach; ?>
		</table>
	<?php else: ?>
		<p>No events found.</p>
	<?php endif; ?>
<?php
}


function display_news( $header='h2' ) {
	$options = get_option( THEME_OPTIONS_NAME );
	$count   = $options['news_max_items'];
	$news    = get_news( 0, ( $count ) ? $count : 2 );
?>
	<?php if ( count( $news ) ): ?>
		<<?php echo $header; ?>><a href="<?php echo $news[0]->get_feed()->get_link(); ?>"><?php echo $news[0]->get_feed()->get_title(); ?></a></<?php echo $header; ?>>
		<ul class="news">
			<?php foreach ( $news as $key=>$item ): $image = get_article_image( $item ); $first = ( $key == 0 ); ?>
			<li class="item<?php if ( $first ): ?> first<?php else: ?> not-first<?php endif; ?>">
				<h3 class="title"><a href="<?php echo $item->get_link(); ?>" class="ignore-external title"><?php echo $item->get_title(); ?></a></h3>
				<p>
					<a class="image ignore-external" href="<?php echo $item->get_link(); ?>">
						<?php if ( $image ): ?>
						<img src="<?php echo $image; ?>" alt="Feed image for <?php echo $item->get_title(); ?>">
						<?php endif; ?>
					</a>
					<a class="description ignore-external"  href="<?php echo $item->get_link(); ?>">
						<?php echo $item->get_description(); ?>
					</a>
				</p>
			</li>
			<?php endforeach;?>
		</ul>
	<?php else: ?>
		<p>No news stories found.</p>
	<?php endif; ?>
<?php
}


function get_events( $start=null, $limit=null ) {
	$options = get_option( THEME_OPTIONS_NAME );
	$url     = $options['events_url'];
	$events  = array_reverse( FeedManager::get_items( $url ) );
	$events  = array_slice( $events, $start, $limit );
	return $events;
}


function get_news( $start=null, $limit=null ) {
	$options = get_option( THEME_OPTIONS_NAME );
	$url     = $options['news_url'];
	$news    = FeedManager::get_items( $url, $start, $limit );
	return $news;
}


?>
