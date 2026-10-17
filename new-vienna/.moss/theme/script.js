// KERN and Projektschau switch dark mode on data-kern-theme; moss's toggle sets data-theme on <html>.
( function () {
	'use strict';
	var root = document.documentElement;
	function mirror() { var t = root.getAttribute( 'data-theme' ); if ( t ) { root.setAttribute( 'data-kern-theme', t ); } }
	mirror();
	new MutationObserver( mirror ).observe( root, { attributes: true, attributeFilter: [ 'data-theme' ] } );
}() );

// A partner without a portrait gets an initials tile in the portrait's place on the Partners index, so every card has the same shape (moss draws no stand-in for a missing cover on a list card).
( function () {
	'use strict';
	document.querySelectorAll( 'body[data-path$="/partners/"] .moss-cards .moss-card-row' ).forEach( function ( row ) {
		if ( row.querySelector( '.moss-card-cover' ) ) { return; }
		var name = ( row.querySelector( '.moss-card-title' ) || {} ).textContent || '';
		var words = name.trim().split( /\s+/ ).filter( function ( w ) { return /^\p{Lu}/u.test( w ); } );
		var tile = document.createElement( 'div' );
		tile.className = 'moss-card-cover partner-initials';
		tile.setAttribute( 'aria-hidden', 'true' );
		tile.textContent = ( words[ 0 ] ? words[ 0 ][ 0 ] : '' ) + ( words.length > 1 ? words[ words.length - 1 ][ 0 ] : '' );
		row.appendChild( tile );
	} );
}() );
