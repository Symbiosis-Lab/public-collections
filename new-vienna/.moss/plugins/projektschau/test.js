// Run: node test.js [path-to-moss-list.json]
// With a `moss-cli list --json` file, every page address the build produced is checked as well.
'use strict';
const assert = require( 'assert' );
const T = require( './main.js' )._t;

// Colour derivation: the five base colours of the board against farben.py's output (Projektschau skripte/farben.py).
const COLOURS = {
	'#a3312a': [ '#b95349', '#8e1e1a', '#de9c93' ],
	'#2f7d6d': [ '#3c8273', '#045c4d', '#91b9af' ],
	'#b8611a': [ '#b55c09', '#793a00', '#daa17c' ],
	'#2f6aa3': [ '#467aaf', '#115087', '#93b3d4' ],
	'#4f7a2a': [ '#598139', '#325b01', '#9fb98d' ]
};
Object.keys( COLOURS ).forEach( function ( base ) {
	const c = T.deriveColours( base ), e = COLOURS[ base ];
	assert.deepStrictEqual( [ c.hell.area, c.hell.fg, c.dunkel.fg ], e, base );
	assert.strictEqual( c.hell.on, '#ffffff' );
	assert.strictEqual( c.dunkel.area, c.hell.area );
} );

// Slugs: source name (file stem or folder) to the address segment moss-cli list shows.
const SLUGS = [
	[ 'Education & culture', 'education-and-culture' ],
	[ "Children's open-air pools", 'children-s-open-air-pools' ],
	[ "Workers' Academy", 'workers-academy' ],
	[ 'Schönbrunn school for educators', 'schönbrunn-school-for-educators' ],
	[ 'Friedrich-Engels-Platz estate', 'friedrich-engels-platz-estate' ],
	[ 'George-Washington-Hof', 'george-washington-hof' ],
	[ 'Pedagogical Institute of the City of Vienna', 'pedagogical-institute-of-the-city-of-vienna' ],
	[ "Second Workers' Olympiad", 'second-workers-olympiad' ],
	[ 'Otto Glöckel', 'otto-glöckel' ],
	[ 'Karl-Marx-Hof', 'karl-marx-hof' ]
];
SLUGS.forEach( function ( p ) { assert.strictEqual( T.slug( p[ 0 ] ), p[ 1 ], p[ 0 ] ); } );
// not seen in this site's names; from moss-core's slug.rs, which keeps dots and underscores become hyphens
assert.strictEqual( T.slug( 'v1.2 Notes_x' ), 'v1.2-notes-x' );
// a decomposed (macOS) spelling gives the same address as the composed one
assert.strictEqual( T.slug( 'Schönbrunn' ), T.slug( 'Schönbrunn' ) );

if ( process.argv[ 2 ] ) {
	const rows = JSON.parse( require( 'fs' ).readFileSync( process.argv[ 2 ], 'utf8' ) );
	let n = 0;
	rows.forEach( function ( r ) {
		if ( ! r.source_path || r.kind === 'folder' && /index\.md$/.test( r.source_path ) && r.url_path === 'index.html' ) { return; }
		const parts = r.source_path.replace( /\/index\.md$/, '' ).replace( /\.md$/, '' ).split( '/' );
		assert.strictEqual( parts.map( T.slug ).join( '/' ) + '/index.html', r.url_path.normalize( 'NFC' ), r.source_path );
		n++;
	} );
	console.log( 'addresses checked against moss-cli list: ' + n );
}

// Frontmatter subset, years, status wording.
const d = T.parseDocument( '---\ntitle: "Second Workers\' Olympiad"\nkind: Event\nby: false\npartners: [Karl Ehn, "A, B"]\nfigure: 1,382 flats\n---\n\nBody *text*.\n' );
assert.deepStrictEqual( d.fm, { title: "Second Workers' Olympiad", kind: 'Event', by: false, partners: [ 'Karl Ehn', 'A, B' ], figure: '1,382 flats' } );
assert.strictEqual( T.statusLine( 'Founded', 'Service', T.parseYears( '1925–1934' ) ), 'Founded 1925 · closed 1934' );
assert.strictEqual( T.statusLine( 'Introduced', 'Programme', T.parseYears( '1923-1934' ) ), 'Introduced 1923 · until 1934' );
assert.strictEqual( T.statusLine( 'Built', 'Building', T.parseYears( '1927–1933' ) ), 'Built 1927–1933' );
assert.strictEqual( T.statusLine( 'Introduced', 'Programme', T.parseYears( 'from 1919' ) ), 'Introduced 1919' );
assert.strictEqual( T.inline( 'a *b* [c & d](https://x.y/?q=1) e' ), 'a <em>b</em> <a href="https://x.y/?q=1">c &amp; d</a> e' );
console.log( 'projektschau plugin: all checks passed' );
