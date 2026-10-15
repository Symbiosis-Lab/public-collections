// The Projektschau board on the home page. The page carries no markup for it: the plugin writes
// /projekte.json, this script mounts Projektschau's renderer after the page's own text.
( function () {
	'use strict';
	var body = document.body;
	if ( ! body || body.getAttribute( 'data-page' ) !== 'home' ) { return; }

	// KERN and Projektschau switch dark mode on data-kern-theme; moss's toggle sets data-theme on <html>.
	var root = document.documentElement;
	function mirror() { var t = root.getAttribute( 'data-theme' ); if ( t ) { root.setAttribute( 'data-kern-theme', t ); } }
	mirror();
	new MutationObserver( mirror ).observe( root, { attributes: true, attributeFilter: [ 'data-theme' ] } );

	function mount() {
		var article = document.querySelector( 'main article' );
		if ( ! article || article.querySelector( '[data-projektschau]' ) ) { return; }

		var board = document.createElement( 'div' );
		board.setAttribute( 'data-projektschau', '' );
		board.setAttribute( 'data-src', '/projekte.json' );
		board.setAttribute( 'data-ebene', '2' );
		board.setAttribute( 'data-sprache-vorgabe', 'en' );

		// moss lists the folder's pages under the text; the board is that listing. Hidden, not removed, so the
		// plain list is still there for a reader whose script does not run.
		var list = article.querySelector( '.moss-cards-container' );
		if ( list ) { list.parentNode.insertBefore( board, list ); list.hidden = true; } else { article.appendChild( board ); }

		var base = ( window.mossTheme && window.mossTheme.base ) || '/_moss/theme/';
		var css = document.createElement( 'link' );
		css.rel = 'stylesheet';
		css.href = new URL( 'projektschau/projektschau.css', base ).href;
		document.head.appendChild( css );
		// The stylesheet is requested first; the renderer fills the mount when its script runs.
		var js = document.createElement( 'script' );
		js.src = new URL( 'projektschau/projektschau.js', base ).href;
		document.head.appendChild( js );
	}

	if ( document.readyState === 'loading' ) { document.addEventListener( 'DOMContentLoaded', mount ); } else { mount(); }
}() );
