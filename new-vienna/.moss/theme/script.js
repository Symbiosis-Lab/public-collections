// KERN and Projektschau switch dark mode on data-kern-theme; moss's toggle sets data-theme on <html>.
( function () {
	'use strict';
	var root = document.documentElement;
	function mirror() { var t = root.getAttribute( 'data-theme' ); if ( t ) { root.setAttribute( 'data-kern-theme', t ); } }
	mirror();
	new MutationObserver( mirror ).observe( root, { attributes: true, attributeFilter: [ 'data-theme' ] } );
}() );
