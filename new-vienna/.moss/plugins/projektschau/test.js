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

// Years and status wording.
assert.strictEqual( T.statusLine( 'Founded', 'Service', T.parseYears( '1925–1934' ) ), 'Founded 1925 · closed 1934' );
assert.strictEqual( T.statusLine( 'Introduced', 'Programme', T.parseYears( '1923-1934' ) ), 'Introduced 1923 · until 1934' );
assert.strictEqual( T.statusLine( 'Built', 'Building', T.parseYears( '1927–1933' ) ), 'Built 1927–1933' );
assert.strictEqual( T.statusLine( 'Introduced', 'Programme', T.parseYears( 'from 1919' ) ), 'Introduced 1919' );
assert.strictEqual( T.parseYears( 1921 ).start, 1921 );
assert.strictEqual( T.parseYears( 'soon' ), null );

// listing() on a small hand-made context: two areas, three projects, one partner.
function rec( title, folder, fm, html ) {
	const slug = title.toLowerCase().replace( / /g, '-' );
	return { title, url_path: folder + '/' + slug + '/index.html', url: folder + '/' + slug + '/', lang: 'en', translations: [], frontmatter: fm, html: html || '', folder };
}
const body = '<p>First <em>words</em>.</p><h2 id="x">Notes<a class="moss-heading-anchor" href="#x"></a></h2><ul><li>One <a target="_blank" href="u">link</a></li></ul><h2>Sources</h2><ul><li>s</li></ul>';
const ctx = {
	model: 1, style: 'projektschau',
	page: rec( 'Home', '', {}, '' ),
	folders: [
		rec( 'Small', '', { color: '#2f7d6d', icon: 'heart-pulse' } ),
		rec( 'Big', '', { color: '#a3312a', icon: 'house' } )
	],
	pages: [
		rec( 'Late hall', 'big', { kind: 'Building', years: '1930–1933', partners: [ 'Ada' ], figure: '9 flats' }, body ),
		rec( 'Early hall', 'big', { kind: 'Building', years: 1925 }, body ),
		rec( 'Clinic', 'small', { kind: 'Service', years: 'from 1927' }, body )
	],
	terms: { partners: { Ada: 'partners/ada/index.html' } }
};
ctx.page.url_path = 'index.html'; ctx.page.url = './';
ctx.folders[ 0 ].url = 'small/'; ctx.folders[ 1 ].url = 'big/';
const out = T.buildPackage( ctx ), pkg = out.pkg;
assert.deepStrictEqual( out.warnings, [] );
assert.deepStrictEqual( pkg.bereiche.map( a => a.schluessel ), [ 'big', 'small' ] );
assert.deepStrictEqual( pkg.projekte.map( p => [ p.nr, p.titel.en ] ), [ [ 1, 'Early hall' ], [ 2, 'Clinic' ], [ 3, 'Late hall' ] ] );
assert.strictEqual( pkg.projekte[ 2 ].links[ 0 ].url, 'big/late-hall/' );
assert.strictEqual( pkg.projekte[ 2 ].abschnitte.find( s => s.label.en === 'Partners' ).punkte[ 0 ].en, '<a href="partners/ada/">Ada</a>' );
assert.deepStrictEqual( pkg.projekte[ 2 ].abschnitte.map( s => s.label.en ), [ 'Notes', 'Partners' ] );
assert.strictEqual( pkg.projekte[ 2 ].abschnitte[ 0 ].punkte[ 0 ].en, 'One <a href="u">link</a>' );
assert.strictEqual( pkg.projekte[ 2 ].beschreibung.en, '<p>First <em>words</em>.</p>' );

// Warnings: unknown kind, unreadable years, area without a colour.
ctx.pages.push( rec( 'Odd', 'big', { kind: 'Monument', years: '1930' } ), rec( 'Bad', 'big', { kind: 'Event', years: 'soon' } ) );
ctx.folders.push( rec( 'Grey', '', {} ) ); ctx.folders[ 2 ].url = 'grey/';
ctx.pages.push( rec( 'Lost', 'grey', { kind: 'Event', years: '1930' } ) );
const w = T.buildPackage( ctx ).warnings.join( '\n' );
assert.ok( /Odd: kind "Monument"/.test( w ) && /Bad: years "soon"/.test( w ) && /Lost: its area "Grey" has no color/.test( w ), w );
console.log( 'projektschau plugin: all checks passed' );
