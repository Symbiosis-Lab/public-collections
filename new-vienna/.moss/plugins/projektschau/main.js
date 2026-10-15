/*
 * projektschau: a site-local moss `process` plugin.
 *
 * Reads the board's project files (frontmatter + body), builds the Projektschau v1 data package
 * (https://projektschau.de, README section 2) and writes it as projekte.json at the site root.
 * Plain JavaScript for moss's QuickJS plugin engine: no npm, no DOMParser, no URLSearchParams.
 *
 * Area icons are from Lucide (https://lucide.dev), ISC licence.
 * Colour method: Projektschau skripte/farben.py (KERN colour ramps in OKLCH), ported line for line.
 */
( function () {
	'use strict';

	// ---- slugs: moss-core/src/slug.rs generate_slug, ported line for line ----------------------------------------
	function slug( text ) {
		var s = String( text );
		if ( s.normalize ) { s = s.normalize( 'NFC' ); }
		s = s.toLowerCase().replace( /[ _]/g, '-' ).replace( /&/g, 'and' ).replace( /@/g, 'at' ).replace( /\+/g, 'plus' )
			.replace( /#/g, 'hash' ).replace( /%/g, 'percent' );
		var out = '';
		var chars = Array.from( s );
		for ( var i = 0; i < chars.length; i++ ) {
			var c = chars[ i ];
			out += ( /[\p{L}\p{N}]/u.test( c ) || c === '-' || c === '.' ) ? c : '-';
		}
		out = out.split( '-' ).filter( function ( p ) { return p.length > 0; } ).join( '-' );
		out = Array.from( out ).slice( 0, 100 ).join( '' ).replace( /-+$/, '' );
		return out || 'untitled';
	}

	// ---- colours: skripte/farben.py ------------------------------------------------------------------------------
	var STUFEN = [ 25, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950 ];
	var HELLIGKEIT = [ 96.4, 93.8, 91.0, 86.5, 82.0, 78.1, 75.4, 70.8, 67.0, 63.2, 57.0, 53.5, 50.4, 46.9, 42.4, 38.6, 34.1, 30.1, 25.9, 20.9 ];
	var CHROMA_PROFIL = [ 0.07, 0.13, 0.19, 0.29, 0.39, 0.47, 0.53, 0.62, 0.70, 0.77, 0.88, 0.94, 0.98, 1.00, 0.97, 0.93, 0.87, 0.80, 0.70, 0.57 ];
	var WEISS = '#ffffff';

	function lin( c ) { return c <= 0.04045 ? c / 12.92 : Math.pow( ( c + 0.055 ) / 1.055, 2.4 ); }
	function gamma( c ) { return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow( c, 1 / 2.4 ) - 0.055; }
	function hexToRgb( h ) {
		h = h.replace( /^#/, '' );
		return [ 0, 2, 4 ].map( function ( i ) { return parseInt( h.substr( i, 2 ), 16 ) / 255; } );
	}
	// Python's round() rounds half to even; Math.round rounds half up. A hex digit could drift by one.
	function pyRound( x ) {
		var f = Math.floor( x ), d = x - f;
		if ( d < 0.5 ) { return f; }
		if ( d > 0.5 ) { return f + 1; }
		return f % 2 === 0 ? f : f + 1;
	}
	function rgbToHex( rgb ) {
		return '#' + rgb.map( function ( c ) {
			var v = pyRound( Math.max( 0, Math.min( 1, c ) ) * 255 );
			return ( v < 16 ? '0' : '' ) + v.toString( 16 );
		} ).join( '' );
	}
	function rgbToOklch( rgb ) {
		var r = lin( rgb[ 0 ] ), g = lin( rgb[ 1 ] ), b = lin( rgb[ 2 ] );
		var l = Math.pow( 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b, 1 / 3 );
		var m = Math.pow( 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b, 1 / 3 );
		var s = Math.pow( 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b, 1 / 3 );
		var L = 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s;
		var a = 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s;
		var bb = 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s;
		var H = ( Math.atan2( bb, a ) * 180 / Math.PI ) % 360;
		if ( H < 0 ) { H += 360; }
		return [ L * 100, Math.hypot( a, bb ), H ];
	}
	function oklchToRgb( L, C, H ) {
		L /= 100;
		var a = C * Math.cos( H * Math.PI / 180 ), bb = C * Math.sin( H * Math.PI / 180 );
		var l = Math.pow( L + 0.3963377774 * a + 0.2158037573 * bb, 3 );
		var m = Math.pow( L - 0.1055613458 * a - 0.0638541728 * bb, 3 );
		var s = Math.pow( L - 0.0894841775 * a - 1.2914855480 * bb, 3 );
		return [
			4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
			-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
			-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
		].map( gamma );
	}
	function inGamut( rgb ) { return rgb.every( function ( c ) { return c >= -0.0005 && c <= 1.0005; } ); }
	function oklchToHex( L, C, H ) {
		while ( C > 0 && ! inGamut( oklchToRgb( L, C, H ) ) ) { C -= 0.002; }
		return rgbToHex( oklchToRgb( L, Math.max( C, 0 ), H ) );
	}
	function luminance( h ) {
		var c = hexToRgb( h ).map( lin );
		return 0.2126 * c[ 0 ] + 0.7152 * c[ 1 ] + 0.0722 * c[ 2 ];
	}
	function contrast( a, b ) {
		var la = luminance( a ), lb = luminance( b );
		return ( Math.max( la, lb ) + 0.05 ) / ( Math.min( la, lb ) + 0.05 );
	}
	function profileAt( L ) {
		if ( L >= HELLIGKEIT[ 0 ] ) { return CHROMA_PROFIL[ 0 ]; }
		if ( L <= HELLIGKEIT[ HELLIGKEIT.length - 1 ] ) { return CHROMA_PROFIL[ CHROMA_PROFIL.length - 1 ]; }
		for ( var i = 0; i < HELLIGKEIT.length - 1; i++ ) {
			var a = HELLIGKEIT[ i ], b = HELLIGKEIT[ i + 1 ];
			if ( b <= L && L <= a ) {
				var t = ( a - L ) / ( a - b );
				return CHROMA_PROFIL[ i ] + t * ( CHROMA_PROFIL[ i + 1 ] - CHROMA_PROFIL[ i ] );
			}
		}
		return 1.0;
	}
	function ramp( base ) {
		var lch = rgbToOklch( hexToRgb( base ) ), L0 = lch[ 0 ], C0 = lch[ 1 ], H = lch[ 2 ];
		var peak = C0 / Math.max( profileAt( L0 ), 0.05 ), steps = {};
		for ( var i = 0; i < STUFEN.length; i++ ) {
			var L = HELLIGKEIT[ i ], C = peak * CHROMA_PROFIL[ i ], h = oklchToHex( L, C, H );
			if ( STUFEN[ i ] === 500 ) {
				while ( contrast( h, WEISS ) < 4.5 && L > 40 ) { L -= 0.1; h = oklchToHex( L, C, H ); }
			}
			steps[ STUFEN[ i ] ] = h;
		}
		return steps;
	}
	// area = step 500, on = white, fg light = step 700, fg dark = step 300 (README 2.6)
	function deriveColours( base ) {
		var r = ramp( String( base ).toLowerCase() );
		return {
			hell: { area: r[ 500 ], on: WEISS, fg: r[ 700 ], brand: String( base ).toLowerCase() },
			dunkel: { area: r[ 500 ], on: WEISS, fg: r[ 300 ], brand: String( base ).toLowerCase() }
		};
	}

	// ---- icons: Lucide, ISC licence. The vocabulary is this plugin's own: moss has no icon names. ------------------
	var ICONS = {
		'house': '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>',
		'heart-pulse': '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
		'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
		'book-open': '<path d="M12 7v14"/><path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z"/>',
		'trophy': '<path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>'
	};
	var ALL_ICON = '<path d="M12 3v18"/><path d="M3 12h18"/><rect x="3" y="3" width="18" height="18" rx="2"/>';

	// ---- kinds: this plugin's vocabulary for the project `kind` field -------------------------------------------
	var KINDS = [
		{ name: 'Building', verb: 'Built' },
		{ name: 'Service', verb: 'Founded' },
		{ name: 'Programme', verb: 'Introduced' },
		{ name: 'Event', verb: 'Held' }
	];

	// ---- frontmatter: the subset the board uses ------------------------------------------------------------------
	function unquote( v ) {
		v = v.trim();
		var q = v.charAt( 0 );
		if ( ( q === '"' || q === "'" ) && v.length >= 2 && v.charAt( v.length - 1 ) === q ) {
			v = v.slice( 1, -1 );
			if ( q === '"' ) { v = v.replace( /\\(["\\])/g, '$1' ); } else { v = v.replace( /''/g, "'" ); }
		}
		return v;
	}
	function splitList( inner ) {
		var items = [], cur = '', quote = '';
		for ( var i = 0; i < inner.length; i++ ) {
			var c = inner.charAt( i );
			if ( quote ) { cur += c; if ( c === quote ) { quote = ''; } }
			else if ( c === '"' || c === "'" ) { quote = c; cur += c; }
			else if ( c === ',' ) { items.push( cur ); cur = ''; }
			else { cur += c; }
		}
		if ( cur.trim() !== '' ) { items.push( cur ); }
		return items.map( unquote );
	}
	function parseValue( raw ) {
		var v = raw.trim();
		if ( v.charAt( 0 ) === '[' && v.charAt( v.length - 1 ) === ']' ) { return splitList( v.slice( 1, -1 ) ); }
		if ( v === 'false' ) { return false; }
		if ( v === 'true' ) { return true; }
		return unquote( v );
	}
	function parseDocument( text ) {
		text = text.replace( /^\uFEFF/, '' ).replace( /\r\n?/g, '\n' );
		var fm = {}, body = text;
		if ( /^---[ \t]*\n/.test( text ) ) {
			var end = text.indexOf( '\n---', 3 );
			if ( end >= 0 ) {
				text.slice( text.indexOf( '\n' ) + 1, end + 1 ).split( '\n' ).forEach( function ( line ) {
					var m = /^([A-Za-z_][\w-]*):(.*)$/.exec( line );
					if ( m ) { fm[ m[ 1 ] ] = parseValue( m[ 2 ] ); }
				} );
				var after = text.indexOf( '\n', end + 1 );
				body = after < 0 ? '' : text.slice( after + 1 );
			}
		}
		return { fm: fm, body: body };
	}

	// ---- body: first paragraph and `## ` sections ----------------------------------------------------------------
	function escapeHtml( s ) { return s.replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' ); }
	// Inline markdown to the HTML the renderer allows: links, strong, em. Everything else is text.
	function inline( s ) {
		var links = [];
		s = s.replace( /\[([^\]]+)\]\(([^)\s]+)\)/g, function ( _, t, u ) { links.push( [ t, u ] ); return '\u0001' + ( links.length - 1 ) + '\u0002'; } );
		s = escapeHtml( s )
			.replace( /\*\*([^*]+)\*\*/g, '<strong>$1</strong>' )
			.replace( /(^|[^*\w])\*([^*]+)\*(?!\*)/g, '$1<em>$2</em>' )
			.replace( /(^|[^\w])_([^_]+)_(?!\w)/g, '$1<em>$2</em>' );
		return s.replace( /\u0001(\d+)\u0002/g, function ( _, i ) {
			return '<a href="' + escapeHtml( links[ i ][ 1 ] ).replace( /"/g, '&quot;' ) + '">' + escapeHtml( links[ i ][ 0 ] ) + '</a>';
		} );
	}
	function blocks( body ) {
		return body.split( /\n[ \t]*\n/ ).map( function ( b ) { return b.replace( /^\n+|\n+$/g, '' ); } ).filter( function ( b ) { return b.trim() !== ''; } );
	}
	function isProse( b ) { return ! /^(#|!\[|[-*+] |\d+\. |>|\||<)/.test( b ); }
	function firstParagraph( body ) {
		var bs = blocks( body );
		for ( var i = 0; i < bs.length; i++ ) {
			if ( /^## /.test( bs[ i ] ) ) { return ''; }
			if ( isProse( bs[ i ] ) ) { return bs[ i ].replace( /\n/g, ' ' ); }
		}
		return '';
	}
	// [{ heading, items: [md…], paragraphs: [md…] }] for every `## ` section
	function sections( body ) {
		var out = [], cur = null;
		body.split( '\n' ).forEach( function ( line ) {
			var h = /^## (.+?)\s*$/.exec( line );
			if ( h ) { cur = { heading: h[ 1 ], items: [], text: [] }; out.push( cur ); return; }
			if ( ! cur ) { return; }
			var li = /^[-*+] (.*)$/.exec( line );
			if ( li ) { cur.items.push( li[ 1 ].trim() ); }
			else if ( line.trim() !== '' && ! /^!\[/.test( line ) ) { cur.text.push( line.trim() ); }
		} );
		return out;
	}

	// ---- years / status ------------------------------------------------------------------------------------------
	function parseYears( s ) {
		s = String( s || '' ).trim();
		var m;
		if ( ( m = /^from (\d{4})$/.exec( s ) ) ) { return { start: +m[ 1 ], end: null, open: true, text: 'from ' + m[ 1 ] }; }
		if ( ( m = /^(\d{4})\s*[–-]\s*(\d{4})$/.exec( s ) ) ) { return { start: +m[ 1 ], end: +m[ 2 ], open: false, text: m[ 1 ] + '–' + m[ 2 ] }; }
		if ( ( m = /^(\d{4})$/.exec( s ) ) ) { return { start: +m[ 1 ], end: +m[ 1 ], open: false, text: m[ 1 ] }; }
		return null;
	}
	function statusLine( verb, kind, y ) {
		if ( y.open || y.end === y.start ) { return verb + ' ' + y.start; }
		if ( kind === 'Service' ) { return verb + ' ' + y.start + ' · closed ' + y.end; }
		if ( kind === 'Programme' ) { return verb + ' ' + y.start + ' · until ' + y.end; }
		return verb + ' ' + y.start + '–' + y.end;
	}

	// ---- the package ---------------------------------------------------------------------------------------------
	function pair( en ) { return { en: en }; }
	function dirOf( p ) { var i = p.lastIndexOf( '/' ); return i < 0 ? '' : p.slice( 0, i ); }
	function baseOf( p ) { var i = p.lastIndexOf( '/' ); return i < 0 ? p : p.slice( i + 1 ); }
	function stemOf( p ) { return baseOf( p ).replace( /\.md$/, '' ); }
	function urlFor( dir, file ) {
		var parts = dir ? dir.split( '/' ).map( slug ) : [];
		if ( file ) { parts.push( slug( file ) ); }
		return '/' + ( parts.length ? parts.join( '/' ) + '/' : '' );
	}

	// docs: [{ path, text }] every .md of the site; homes: set of paths that are a folder's home page.
	function buildPackage( docs, homes ) {
		var parsed = {}, boardHome = null;
		docs.forEach( function ( d ) {
			parsed[ d.path ] = parseDocument( d.text );
			if ( homes[ d.path ] && parsed[ d.path ].fm.children_style === 'projektschau' && boardHome === null ) { boardHome = d.path; }
		} );
		if ( boardHome === null ) { return null; }
		var root = dirOf( boardHome ), prefix = root ? root + '/' : '';

		// areas: the board's subfolders whose home page carries `color`
		var areas = [];
		Object.keys( parsed ).forEach( function ( p ) {
			if ( ! homes[ p ] || p.indexOf( prefix ) !== 0 ) { return; }
			var rel = p.slice( prefix.length ), parts = rel.split( '/' );
			if ( parts.length !== 2 || ! parsed[ p ].fm.color ) { return; }
			var fm = parsed[ p ].fm;
			areas.push( { dir: parts[ 0 ], key: slug( parts[ 0 ] ), title: fm.title || parts[ 0 ], color: fm.color, icon: fm.icon, weight: fm.weight === undefined ? 0 : +fm.weight } );
		} );
		areas.sort( function ( a, b ) { return a.weight - b.weight || ( a.title < b.title ? -1 : a.title > b.title ? 1 : 0 ); } );
		var areaByDir = {};
		areas.forEach( function ( a ) { areaByDir[ a.dir ] = a; } );

		// projects: files with a `kind` in an area folder
		var kindsSeen = [], projects = [];
		Object.keys( parsed ).forEach( function ( p ) {
			if ( homes[ p ] || p.indexOf( prefix ) !== 0 ) { return; }
			var parts = p.slice( prefix.length ).split( '/' ), fm = parsed[ p ].fm;
			if ( parts.length !== 2 || ! areaByDir[ parts[ 0 ] ] || ! fm.kind ) { return; }
			var years = parseYears( fm.years );
			if ( ! years ) { return; }
			projects.push( { path: p, area: areaByDir[ parts[ 0 ] ], fm: fm, body: parsed[ p ].body, years: years, title: fm.title || stemOf( p ) } );
			if ( kindsSeen.indexOf( fm.kind ) < 0 ) { kindsSeen.push( fm.kind ); }
		} );
		projects.sort( function ( a, b ) { return a.years.start - b.years.start || ( a.title < b.title ? -1 : a.title > b.title ? 1 : 0 ); } );

		var kindNames = KINDS.map( function ( k ) { return k.name; } );
		kindsSeen.sort( function ( a, b ) {
			var ia = kindNames.indexOf( a ), ib = kindNames.indexOf( b );
			return ( ia < 0 ? 99 : ia ) - ( ib < 0 ? 99 : ib );
		} );
		var verbs = {};
		KINDS.forEach( function ( k ) { verbs[ k.name ] = k.verb; } );

		var pkg = {
			_generated: 'by the projektschau plugin; do not edit',
			version: 1,
			sprachen: [ 'en' ],
			texte: {
				kopf: { titel: pair( 'All ' + projects.length + ' projects' ) },
				filter: { bereich_label: pair( 'Area' ), einordnung_label: pair( 'Kind' ), aria_bereich: pair( 'Filter by area' ), aria_einordnung: pair( 'Filter by kind' ) },
				ansicht: { karten: pair( 'Cards' ), zeitleiste: pair( 'Timeline' ), aria: pair( 'Choose view' ) },
				sprache: { aria: pair( 'Choose language' ) },
				leerzustand: { meldung: pair( 'No project matches this selection.' ), zuruecksetzen: pair( 'Reset filters' ) },
				zeitleiste: { aria: pair( 'Project timeline' ) }
			},
			filter_alle: { bereich: { label: pair( 'All' ), icon_svg: ALL_ICON } },
			bereiche: areas.map( function ( a ) {
				var b = { schluessel: a.key, label: pair( a.title ) };
				if ( ICONS[ a.icon ] ) { b.icon_svg = ICONS[ a.icon ]; }
				b.farben = deriveColours( a.color );
				return b;
			} ),
			einordnungen: kindsSeen.map( function ( k ) {
				return { schluessel: slug( k ), label: pair( k ), label_zeitleiste: pair( k ), als_filter_chip: true };
			} ),
			projekte: []
		};

		projects.forEach( function ( pr, i ) {
			var fm = pr.fm, y = pr.years;
			var abschnitte = [];
			sections( pr.body ).forEach( function ( s ) {
				if ( s.heading === 'Sources' ) { return; }
				if ( s.items.length ) { abschnitte.push( { typ: 'liste', label: pair( s.heading ), punkte: s.items.map( function ( t ) { return pair( inline( t ) ); } ) } ); }
				else if ( s.text.length ) { abschnitte.push( { typ: 'text', label: pair( s.heading ), text: pair( '<p>' + inline( s.text.join( ' ' ) ) + '</p>' ) } ); }
			} );
			var partners = Array.isArray( fm.partners ) ? fm.partners : [];
			if ( partners.length ) {
				abschnitte.push( {
					typ: 'liste', label: pair( 'Partners' ),
					punkte: partners.map( function ( n ) { return pair( '<a href="' + urlFor( 'Partners', n ).replace( /"/g, '&quot;' ) + '">' + escapeHtml( n ) + '</a>' ); } )
				} );
			}
			var rec = {
				nr: i + 1,
				bereich: pr.area.key,
				einordnung: slug( fm.kind )
			};
			if ( ICONS[ pr.area.icon ] ) { rec.icon_svg = ICONS[ pr.area.icon ]; }
			rec.titel = pair( pr.title );
			rec.status = pair( fm.status ? String( fm.status ) : statusLine( verbs[ fm.kind ] || fm.kind, fm.kind, y ) );
			var desc = firstParagraph( pr.body );
			if ( desc ) { rec.beschreibung = pair( '<p>' + inline( desc ) + '</p>' ); }
			rec.abschnitte = abschnitte;
			if ( fm.figure ) { rec.kennzahl = pair( escapeHtml( String( fm.figure ) ) ); }
			rec.links = [ { url: urlFor( dirOf( pr.path ).slice( prefix.length ), stemOf( pr.path ) ), text: pair( 'Project page and sources' ) } ];
			rec.zeitleiste = { sortierung: y.start * 100 + 1, zeitraum: pair( y.text ) };
			pkg.projekte.push( rec );
		} );
		return pkg;
	}

	// ---- hook ----------------------------------------------------------------------------------------------------
	function invoke( cmd, args ) { return window.__TAURI__.core.invoke( cmd, args || {} ); }

	async function process( ctx ) {
		try {
			var tree = await invoke( 'list_project_tree' ), docs = [], homes = {};
			for ( var i = 0; i < tree.length; i++ ) {
				var f = tree[ i ];
				if ( ! /\.md$/.test( f.path ) ) { continue; }
				docs.push( { path: f.path, text: await invoke( 'read_project_file', { relativePath: f.path } ) } );
				if ( f.is_home ) { homes[ f.path ] = true; }
			}
			var pkg = buildPackage( docs, homes );
			if ( pkg === null ) { return { success: true, message: 'projektschau: no page with children_style: projektschau, nothing to do' }; }
			var json = JSON.stringify( pkg, null, 2 ) + '\n', old = null;
			try { old = await invoke( 'read_project_file', { relativePath: 'projekte.json' } ); } catch ( e ) { old = null; }
			// An unchanged file is not rewritten: the folder is synced and a preview watches it.
			if ( old !== json ) { await invoke( 'write_project_file', { relativePath: 'projekte.json', data: json } ); }
			return { success: true, message: 'projektschau: ' + pkg.projekte.length + ' projects, ' + pkg.bereiche.length + ' areas' + ( old === json ? ' (unchanged)' : '' ) };
		} catch ( e ) {
			return { success: false, message: 'projektschau: ' + ( e && e.message ? e.message : String( e ) ) };
		}
	}

	var api = { process: process, _t: { slug: slug, deriveColours: deriveColours, parseDocument: parseDocument, parseYears: parseYears, statusLine: statusLine, buildPackage: buildPackage, inline: inline } };
	( typeof window !== 'undefined' ? window : globalThis ).ProjektschauPlugin = api;
	if ( typeof module !== 'undefined' && module.exports ) { module.exports = api; }
}() );
