import store from '@/store';
import TrackData from '@/vo/TrackData';
import { Route } from 'vue-router';

/**
 * Created by Durss
 */
export default class Utils {
	/**
	 * Computes the angular distance between the two angles
	 * 
	 * @param angle1	start angle (generaly the current angle of the target to rotate)
	 * @param angle2	the angle to go to.
	 * @param radians	define if the angles should be treated as radians (true) or degrees (false)
	 * 
	 * @return the distance between the two angles
	 */
	public static angularDistance(start: number, end: number, radians: boolean = true): number {
		let maxA: number = radians ? Math.PI * 2 : 360;
		let phi: number = Math.abs(start - end) % maxA;
		let distance: number = phi > maxA / 2 ? maxA - phi : phi;
		return distance % maxA;
	}

	/**
	 * Shuffle an array
	 */
	public static shuffle(a:any[]):any[] {
		for (let i = a.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[a[i], a[j]] = [a[j], a[i]];
		}
		return a;
	}

	public static levenshtein(a: string, b: string): number {
		if (a.length == 0) return b.length;
		if (b.length == 0) return a.length;

		let matrix: number[][] = [];
		a = this.slugify(a);
		b = this.slugify(b);

		// increment along the first column of each row
		let i: number;
		for (i = 0; i <= b.length; i++) {
			matrix[i] = [i];
		}

		// increment each column in the first row
		let j: number;
		for (j = 0; j <= a.length; j++) {
			matrix[0][j] = j;
		}

		// Fill in the rest of the matrix
		for (i = 1; i <= b.length; i++) {
			for (j = 1; j <= a.length; j++) {
				if (b.charAt(i - 1) == a.charAt(j - 1)) {
					matrix[i][j] = matrix[i - 1][j - 1];
				} else {
					matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
						Math.min(matrix[i][j - 1] + 1, // insertion
							matrix[i - 1][j] + 1)); // deletion
				}
			}
		}

		// console.log("Levenshtein",a,b,matrix[b.length][a.length])
		return matrix[b.length][a.length];
	};

	/**
	 * Computes a Damerau levenstein distance between two strings.
	 * source : https://github.com/cbaatz/damerau-levenshtein/blob/master/damerau-levenshtein.js
	 * 
	 * @param a			ref string
	 * @param b			compare string
	 * @param prices	@see method's body
	 * @param damerau	if false, don't use "transposition" and do a standard levenstein compute
	 */
	public static levenshteinDamerau(a:string, b:string, prices?:{insert:number, remove:number, substitute:number, transpose:number}, damerau:boolean = true):number {
		//Following lines are not part of levenstein, it's just an addition of mine
		if (a.length == 0) return b.length;
		if (b.length == 0) return a.length;
		a = this.slugify(a);
		b = this.slugify(b);

		// 'prices' customisation of the edit costs by passing an
		// object with optional 'insert', 'remove', 'substitute', and
		// 'transpose' keys, corresponding to either a constant
		// number, or a function that returns the cost. The default
		// cost for each operation is 1. The price functions take
		// relevant character(s) as arguments, should return numbers,
		// and have the following form:
		//
		// insert: function (inserted) { return NUMBER; }
		//
		// remove: function (removed) { return NUMBER; }
		//
		// substitute: function (from, to) { return NUMBER; }
		//
		// transpose: function (backward, forward) { return NUMBER; }
		//
		// The damerau flag allows us to turn off transposition and
		// only do plain Levenshtein distance.
	
		if (damerau !== false) damerau = true;
		if (!prices) prices = {insert:null, remove:null, substitute:null, transpose:null};
		var insert, remove, substitute, transpose;
	
		switch (typeof prices.insert) {
		case 'function': insert = prices.insert; break;
		case 'number': insert = function (c) { return prices.insert; }; break;
		default: insert = function (c) { return 1; }; break; }
	
		switch (typeof prices.remove) {
		case 'function': remove = prices.remove; break;
		case 'number': remove = function (c) { return prices.remove; }; break;
		default: remove = function (c) { return 1; }; break; }
	
		switch (typeof prices.substitute) {
		case 'function': substitute = prices.substitute; break;
		case 'number':
			substitute = function (from, to) { return prices.substitute; };
			break;
		default: substitute = function (from, to) { return 1; }; break; }
	
		switch (typeof prices.transpose) {
		case 'function': transpose = prices.transpose; break;
		case 'number':
			transpose = function (backward, forward) { return prices.transpose; };
			break;
		default: transpose = function (backward, forward) { return 1; }; break; }
	
		function distance(down, across) {
			// http://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
			var ds = [];
			if ( down === across ) {
				return 0;
			} else {
				down = down.split(''); down.unshift(null);
				across = across.split(''); across.unshift(null);
				down.forEach(function (d, i) {
					if (!ds[i]) ds[i] = [];
					across.forEach(function (a, j) {
						if (i === 0 && j === 0) ds[i][j] = 0;
						// Empty down (i == 0) -> across[1..j] by inserting
						else if (i === 0) ds[i][j] = ds[i][j-1] + insert(a);
						// Down -> empty across (j == 0) by deleting
						else if (j === 0) ds[i][j] = ds[i-1][j] + remove(d);
						else {
							// Find the least costly operation that turns
							// the prefix down[1..i] into the prefix
							// across[1..j] using already calculated costs
							// for getting to shorter matches.
							ds[i][j] = Math.min(
								// Cost of editing down[1..i-1] to
								// across[1..j] plus cost of deleting
								// down[i] to get to down[1..i-1].
								ds[i-1][j] + remove(d),
								// Cost of editing down[1..i] to
								// across[1..j-1] plus cost of inserting
								// across[j] to get to across[1..j].
								ds[i][j-1] + insert(a),
								// Cost of editing down[1..i-1] to
								// across[1..j-1] plus cost of
								// substituting down[i] (d) with across[j]
								// (a) to get to across[1..j].
								ds[i-1][j-1] + (d === a ? 0 : substitute(d, a))
							);
							// Can we match the last two letters of down
							// with across by transposing them? Cost of
							// getting from down[i-2] to across[j-2] plus
							// cost of moving down[i-1] forward and
							// down[i] backward to match across[j-1..j].
							if (damerau
								&& i > 1 && j > 1
								&& down[i-1] === a && d === across[j-1]) {
								ds[i][j] = Math.min(
									ds[i][j],
									ds[i-2][j-2] + (d === a ? 0 : transpose(d, down[i-1]))
								);
							};
						};
					});
				});
				return ds[down.length-1][across.length-1];
			};
		};
		return distance(a, b);
	};

	public static slugify(str: string): string {
		return this.removeDiacritics(str.toLowerCase().trim())
			.replace(/[^\w\s-]/g, '') // remove non-word [a-z0-9_], non-whitespace, non-hyphen characters
			.replace(/[\s_-]+/g, '-') // swap any length of whitespace, underscore, hyphen characters with a single -
			.replace(/^-+|-+$/g, '')
			.replace(/&/g, '-and-');
	}



	private static defaultDiacriticsRemovalMap = [
		{
			'base': 'A',
			'letters': '\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F'
		},
		{ 'base': 'AA', 'letters': '\uA732' },
		{ 'base': 'AE', 'letters': '\u00C6\u01FC\u01E2' },
		{ 'base': 'AO', 'letters': '\uA734' },
		{ 'base': 'AU', 'letters': '\uA736' },
		{ 'base': 'AV', 'letters': '\uA738\uA73A' },
		{ 'base': 'AY', 'letters': '\uA73C' },
		{ 'base': 'B', 'letters': '\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181' },
		{ 'base': 'C', 'letters': '\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E' },
		{
			'base': 'D',
			'letters': '\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779\u00D0'
		},
		{ 'base': 'DZ', 'letters': '\u01F1\u01C4' },
		{ 'base': 'Dz', 'letters': '\u01F2\u01C5' },
		{
			'base': 'E',
			'letters': '\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E'
		},
		{ 'base': 'F', 'letters': '\u0046\u24BB\uFF26\u1E1E\u0191\uA77B' },
		{
			'base': 'G',
			'letters': '\u0047\u24BC\uFF27\u01F4\u011C\u1E20\u011E\u0120\u01E6\u0122\u01E4\u0193\uA7A0\uA77D\uA77E'
		},
		{
			'base': 'H',
			'letters': '\u0048\u24BD\uFF28\u0124\u1E22\u1E26\u021E\u1E24\u1E28\u1E2A\u0126\u2C67\u2C75\uA78D'
		},
		{
			'base': 'I',
			'letters': '\u0049\u24BE\uFF29\u00CC\u00CD\u00CE\u0128\u012A\u012C\u0130\u00CF\u1E2E\u1EC8\u01CF\u0208\u020A\u1ECA\u012E\u1E2C\u0197'
		},
		{ 'base': 'J', 'letters': '\u004A\u24BF\uFF2A\u0134\u0248' },
		{
			'base': 'K',
			'letters': '\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2'
		},
		{
			'base': 'L',
			'letters': '\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780'
		},
		{ 'base': 'LJ', 'letters': '\u01C7' },
		{ 'base': 'Lj', 'letters': '\u01C8' },
		{ 'base': 'M', 'letters': '\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C' },
		{
			'base': 'N',
			'letters': '\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4'
		},
		{ 'base': 'NJ', 'letters': '\u01CA' },
		{ 'base': 'Nj', 'letters': '\u01CB' },
		{
			'base': 'O',
			'letters': '\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C'
		},
		{ 'base': 'OI', 'letters': '\u01A2' },
		{ 'base': 'OO', 'letters': '\uA74E' },
		{ 'base': 'OU', 'letters': '\u0222' },
		{ 'base': 'OE', 'letters': '\u008C\u0152' },
		{ 'base': 'oe', 'letters': '\u009C\u0153' },
		{ 'base': 'P', 'letters': '\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754' },
		{ 'base': 'Q', 'letters': '\u0051\u24C6\uFF31\uA756\uA758\u024A' },
		{
			'base': 'R',
			'letters': '\u0052\u24C7\uFF32\u0154\u1E58\u0158\u0210\u0212\u1E5A\u1E5C\u0156\u1E5E\u024C\u2C64\uA75A\uA7A6\uA782'
		},
		{
			'base': 'S',
			'letters': '\u0053\u24C8\uFF33\u1E9E\u015A\u1E64\u015C\u1E60\u0160\u1E66\u1E62\u1E68\u0218\u015E\u2C7E\uA7A8\uA784'
		},
		{
			'base': 'T',
			'letters': '\u0054\u24C9\uFF34\u1E6A\u0164\u1E6C\u021A\u0162\u1E70\u1E6E\u0166\u01AC\u01AE\u023E\uA786'
		},
		{ 'base': 'TZ', 'letters': '\uA728' },
		{
			'base': 'U',
			'letters': '\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244'
		},
		{ 'base': 'V', 'letters': '\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245' },
		{ 'base': 'VY', 'letters': '\uA760' },
		{ 'base': 'W', 'letters': '\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72' },
		{ 'base': 'X', 'letters': '\u0058\u24CD\uFF38\u1E8A\u1E8C' },
		{
			'base': 'Y',
			'letters': '\u0059\u24CE\uFF39\u1EF2\u00DD\u0176\u1EF8\u0232\u1E8E\u0178\u1EF6\u1EF4\u01B3\u024E\u1EFE'
		},
		{
			'base': 'Z',
			'letters': '\u005A\u24CF\uFF3A\u0179\u1E90\u017B\u017D\u1E92\u1E94\u01B5\u0224\u2C7F\u2C6B\uA762'
		},
		{
			'base': 'a',
			'letters': '\u0061\u24D0\uFF41\u1E9A\u00E0\u00E1\u00E2\u1EA7\u1EA5\u1EAB\u1EA9\u00E3\u0101\u0103\u1EB1\u1EAF\u1EB5\u1EB3\u0227\u01E1\u00E4\u01DF\u1EA3\u00E5\u01FB\u01CE\u0201\u0203\u1EA1\u1EAD\u1EB7\u1E01\u0105\u2C65\u0250'
		},
		{ 'base': 'aa', 'letters': '\uA733' },
		{ 'base': 'ae', 'letters': '\u00E6\u01FD\u01E3' },
		{ 'base': 'ao', 'letters': '\uA735' },
		{ 'base': 'au', 'letters': '\uA737' },
		{ 'base': 'av', 'letters': '\uA739\uA73B' },
		{ 'base': 'ay', 'letters': '\uA73D' },
		{ 'base': 'b', 'letters': '\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253' },
		{ 'base': 'c', 'letters': '\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184' },
		{
			'base': 'd',
			'letters': '\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A'
		},
		{ 'base': 'dz', 'letters': '\u01F3\u01C6' },
		{
			'base': 'e',
			'letters': '\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD'
		},
		{ 'base': 'f', 'letters': '\u0066\u24D5\uFF46\u1E1F\u0192\uA77C' },
		{
			'base': 'g',
			'letters': '\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F'
		},
		{
			'base': 'h',
			'letters': '\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265'
		},
		{ 'base': 'hv', 'letters': '\u0195' },
		{
			'base': 'i',
			'letters': '\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131'
		},
		{ 'base': 'j', 'letters': '\u006A\u24D9\uFF4A\u0135\u01F0\u0249' },
		{
			'base': 'k',
			'letters': '\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3'
		},
		{
			'base': 'l',
			'letters': '\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747'
		},
		{ 'base': 'lj', 'letters': '\u01C9' },
		{ 'base': 'm', 'letters': '\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F' },
		{
			'base': 'n',
			'letters': '\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5'
		},
		{ 'base': 'nj', 'letters': '\u01CC' },
		{
			'base': 'o',
			'letters': '\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275'
		},
		{ 'base': 'oi', 'letters': '\u01A3' },
		{ 'base': 'ou', 'letters': '\u0223' },
		{ 'base': 'oo', 'letters': '\uA74F' },
		{ 'base': 'p', 'letters': '\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755' },
		{ 'base': 'q', 'letters': '\u0071\u24E0\uFF51\u024B\uA757\uA759' },
		{
			'base': 'r',
			'letters': '\u0072\u24E1\uFF52\u0155\u1E59\u0159\u0211\u0213\u1E5B\u1E5D\u0157\u1E5F\u024D\u027D\uA75B\uA7A7\uA783'
		},
		{
			'base': 's',
			'letters': '\u0073\u24E2\uFF53\u00DF\u015B\u1E65\u015D\u1E61\u0161\u1E67\u1E63\u1E69\u0219\u015F\u023F\uA7A9\uA785\u1E9B'
		},
		{
			'base': 't',
			'letters': '\u0074\u24E3\uFF54\u1E6B\u1E97\u0165\u1E6D\u021B\u0163\u1E71\u1E6F\u0167\u01AD\u0288\u2C66\uA787'
		},
		{ 'base': 'tz', 'letters': '\uA729' },
		{
			'base': 'u',
			'letters': '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289'
		},
		{ 'base': 'v', 'letters': '\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C' },
		{ 'base': 'vy', 'letters': '\uA761' },
		{ 'base': 'w', 'letters': '\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73' },
		{ 'base': 'x', 'letters': '\u0078\u24E7\uFF58\u1E8B\u1E8D' },
		{
			'base': 'y',
			'letters': '\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF'
		},
		{ 'base': 'z', 'letters': '\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763' }
	];

	private static diacriticsMap: any = null;
	private static initDiacritics(): void {
		this.diacriticsMap = {};
		for (let i = 0; i < this.defaultDiacriticsRemovalMap.length; i++) {
			let letters = this.defaultDiacriticsRemovalMap[i].letters;
			for (let j = 0; j < letters.length; j++) {
				this.diacriticsMap[letters[j]] = this.defaultDiacriticsRemovalMap[i].base;
			}
		}
	}

	public static removeDiacritics(str: string): string {
		if (!this.diacriticsMap) this.initDiacritics();
		return str.replace(/[^\u0000-\u007E]/g, (a) => {
			return this.diacriticsMap[a] || a;
		});
	}

	public static sanitizeString(src: string): string {
		src = src.replace(/</g, "&lt;").replace(/>/g, "&gt;");
		return src;
	}

	public static isMobile(): boolean {
		var check = false;
		(function (a) { if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true; })(navigator.userAgent || navigator.vendor || (<any>window)["opera"]);
		return check;
	}

	/**
	* getLessVars parses your LESS variables to Javascript (provided you make a dummy node in LESS)
	* @param {String} id The CSS-id your variables are listed under.
	* @param {Boolean} [parseNumbers=true] Try to parse units as numbers.
	* @return {Object} A value object containing your LESS variables.
	* @example
	* LESS:
	* 	&#64;myLessVariable: 123px;
	* 	#dummyLessId { width: @myLessVariable; }
	* Javascript:
	* 	getLessVars('dummyLessId');
	* returns:
	* 	{myLessVariable:123}
	*/
	public static getLessVars(id:string = "lessVars", parseNumbers: boolean = true):any {
		var bNumbers = parseNumbers === undefined ? true : parseNumbers
			, oLess = {}
			, rgId = /\#[\w-]+/
			, rgKey = /\.([\w-]+)/
			, rgUnit = /[a-z]+$/
			, aUnits = 'em,ex,ch,rem,vw,vh,vmin,cm,mm,in,pt,pc,px,deg,grad,rad,turn,s,ms,Hz,kHz,dpi,dpcm,dppx'.split(',')
			, rgValue = /:\s?(.*)\s?;\s?\}/
			, rgStr = /^'([^']+)'$/
			, sId = '#' + id
			, oStyles = document.styleSheets;
		for (var i = 0, l = oStyles.length; i < l; i++) {
			var oRules;
			try { oRules = (<any>oStyles[i]).cssRules; }
			catch (e) { continue; }
			if (oRules) {
				for (var j = 0, k = oRules.length; j < k; j++) {
					try { var sRule = oRules[j].cssText; }
					catch (e) { continue; }
					var aMatchId = sRule.match(rgId);
					if (aMatchId && aMatchId[0] == sId) {
						var aKey = sRule.match(rgKey)
							, aVal = sRule.match(rgValue);
						if (aKey && aVal) {
							var sKey = aKey[1]
								, oVal = aVal[1]
								, aUnit
								, aStr;
							if (bNumbers && (aUnit = oVal.match(rgUnit)) && aUnits.indexOf(aUnit[0]) !== -1) {
								oVal = parseFloat(oVal);
							} else if (aStr = oVal.match(rgStr)) {
								oVal = aStr[1];
							}
							(<any>oLess)[sKey] = oVal;
						}
					}
				}
			}
		}
		return oLess;
	}

	public static b64toBlob(b64Data:string, contentType:string, sliceSize?:number) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;

        var byteCharacters = atob(b64Data);
        var byteArrays = [];

        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);

            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            var byteArray = new Uint8Array(byteNumbers);

            byteArrays.push(byteArray);
        }

      var blob = new Blob(byteArrays, {type: contentType});
      return blob;
	}

	/**
	 * Opens up a confirm window so the user can confirm or cancel an action.
	 */
	public static confirm<T>(title:string, data?:T, description?:string):Promise<T> {
		let prom = <Promise<T>>new Promise((resolve, reject) => {
			let confirmData:any = {}
			confirmData.title = title;
			confirmData.description = description;
			confirmData.confirmCallback = ()=> {
				resolve(data);
			};
			confirmData.cancelCallback = ()=> {
				reject(data);
			};
			store.dispatch("confirm", confirmData);
		});
		prom.catch((error)=>{/*ignore*/});//Avoid uncaugh error if not catched externally
		return prom;
	}


	/**
	 * Copies a text to clipboard
	 */
	public static copyToClipboard(text:string):void {
		const el = document.createElement('textarea');
		el.value = text;
		el.setAttribute('readonly', '');
		el.style.position = 'absolute';
		el.style.left = '-9999px';
		document.body.appendChild(el);
		const selected =            
		document.getSelection().rangeCount > 0
			? document.getSelection().getRangeAt(0)
			: false;
		el.select();
		document.execCommand('copy');
		document.body.removeChild(el);
		if (selected) {
			document.getSelection().removeAllRanges();
			document.getSelection().addRange(selected);
		}
	}

	public static getQueryParameterByName(name, url?) {
		if (!url) url = window.location.href;
		name = name.replace(/[\[\]]/g, "\\$&");
		let regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
			results = regex.exec(url);
		if (!results) return null;
		if (!results[2]) return '';
		return decodeURIComponent(results[2].replace(/\+/g, " "));
	}

	public static formatDate(dateStr:string, fallback:string="jamais"):string {
		if(!dateStr) return fallback;
		let date:Date = new Date(dateStr);
		return this.toDigits(date.getDate())+"/"+this.toDigits(date.getMonth()+1)+"/"+date.getFullYear()+" "+this.toDigits(date.getHours())+"h"+this.toDigits(date.getMinutes());
	}

	public static toDigits(num:number, digits:number = 2):string {
		let res = num.toString();
		while(res.length < digits) res = "0"+res;
		return res;
	}

	public static getDemoTracks():TrackData[] {
		
		let tracks = [];
		tracks.push({
			id:"fab3ba2d8224f7006e8c92b7fe1171d50265d37d",
			enabled:false,
			name:"Save Tonight",
			artist:"Eagle-Eye Cherry",
			audioPath:"/mp3/fab3ba2d8224f7006e8c92b7fe1171d50265d37d.mp3",
		});
		tracks.push({
			id:"aa4f9186e0c3f4436bb40572a63862db80d7ef2d",
			enabled:false,
			name:"Highway to Hell",
			artist:"AC/DC",
			audioPath:"/mp3/aa4f9186e0c3f4436bb40572a63862db80d7ef2d.mp3",
		});
		tracks.push({
			id:"b56a70770267b00ccae13c2e8c8a34ed54627d02",
			enabled:false,
			name:"Like a Prayer",
			artist:"Madona",
			audioPath:"/mp3/b56a70770267b00ccae13c2e8c8a34ed54627d02.mp3",
		});
		tracks.push({
			id:"ac8375f8237f6bfd9c03cd074ac674d82f24cc8a",
			enabled:false,
			name:"Romeo and Juliet",
			artist:"Dire Straits",
			audioPath:"/mp3/ac8375f8237f6bfd9c03cd074ac674d82f24cc8a.mp3",
		});
		tracks.push({
			id:"50e82c99c20ffa4223e82250605bbd8500cb3928",
			enabled:false,
			name:"Hotel California",
			artist:"Eagles",
			audioPath:"/mp3/50e82c99c20ffa4223e82250605bbd8500cb3928.mp3",
		});
		tracks.push({
			id:"e7eb60e9466bc3a27299ea8803aadf4fa9cf795c",
			enabled:false,
			name:"Creep",
			artist:"Radiohead",
			audioPath:"/mp3/e7eb60e9466bc3a27299ea8803aadf4fa9cf795c.mp3",
		});
		tracks.push({
			id:"5fcdcfe7ef20abd006bba666b4a7dff01dd5ec21",
			enabled:false,
			name:"My heart will go on (Titanic)",
			artist:"Céline Dion",
			audioPath:"/mp3/5fcdcfe7ef20abd006bba666b4a7dff01dd5ec21.mp3",
		});
		tracks.push({
			id:"645cd4b425f1d48d37656cac99d640254a8f64a9",
			enabled:false,
			name:"Lemon Tree",
			artist:"Fool's Garden",
			audioPath:"/mp3/645cd4b425f1d48d37656cac99d640254a8f64a9.mp3",
		});
		tracks.push({
			id:"22b0ba88409ea7a8d7de70a3f0fa8a3f9a20bdfb",
			enabled:false,
			name:"Can you feel the love tonight",
			artist:"Elton John",
			audioPath:"/mp3/22b0ba88409ea7a8d7de70a3f0fa8a3f9a20bdfb.mp3",
		});
		tracks.push({
			id:"a66864fcfd8923c6084fc2000e3086e4e1e0a657",
			enabled:false,
			name:"Basket Case",
			artist:"Green Day",
			audioPath:"/mp3/a66864fcfd8923c6084fc2000e3086e4e1e0a657.mp3",
		});
		tracks.push({
			id:"2da7ea19b35ecbfaf2dd7273e9b305a4e090bbc9",
			enabled:false,
			name:"Everybody",
			artist:"Backstreet Boys",
			audioPath:"/mp3/2da7ea19b35ecbfaf2dd7273e9b305a4e090bbc9.mp3",
		});
		tracks.push({
			id:"2a5b5a9977f58ae525b473455e9f2e67a9edf8d7",
			enabled:false,
			name:"Freestyler",
			artist:"Bomfunk MC's",
			audioPath:"/mp3/2a5b5a9977f58ae525b473455e9f2e67a9edf8d7.mp3",
		});
		tracks.push({
			id:"0d99160a29e74e74335f3bf7909260c0f2a5ca98",
			enabled:false,
			name:"Scatman (ski-ba-bop-ba-dop-bop)",
			artist:"Scatman John",
			audioPath:"/mp3/0d99160a29e74e74335f3bf7909260c0f2a5ca98.mp3",
		});
		tracks.push({
			id:"e4ef557302eaf59468e8848415c225f24939361f",
			enabled:false,
			name:"Bohemian Rhapsody",
			artist:"Queen",
			audioPath:"/mp3/e4ef557302eaf59468e8848415c225f24939361f.mp3",
		});
		tracks.push({
			id:"8ec3a4b322c0df167ad409a668ceaa704fcbd1c0",
			enabled:false,
			name:"Life on Mars",
			artist:"David Bowie",
			audioPath:"/mp3/8ec3a4b322c0df167ad409a668ceaa704fcbd1c0.mp3",
		});
		tracks.push({
			id:"dd78dafe31bb98f230372c038a126b8808f9349b",
			enabled:false,
			name:"Africa",
			artist:"Toto",
			audioPath:"/mp3/dd78dafe31bb98f230372c038a126b8808f9349b.mp3",
		});
		tracks.push({
			id:"84462d8e1e4d0f9e5ccd06f0da390f65843774a2",
			enabled:false,
			name:"Shape of you",
			artist:"Ed Sheeran",
			audioPath:"/mp3/84462d8e1e4d0f9e5ccd06f0da390f65843774a2.mp3",
		});
		tracks.push({
			id:"cda5ee4b7028e5aaca877263844f0de5354dcdfe",
			enabled:false,
			name:"Barbie Girl",
			artist:"Aqua",
			audioPath:"/mp3/cda5ee4b7028e5aaca877263844f0de5354dcdfe.mp3",
		});
		tracks.push({
			id:"da2134a161f1cb34d17c2d6d7e77cc93d1c1e6f7",
			enabled:false,
			name:"...Baby One More Time",
			artist:"Britney Spears",
			audioPath:"/mp3/da2134a161f1cb34d17c2d6d7e77cc93d1c1e6f7.mp3",
		});
		tracks.push({
			id:"98959d757d14bc4924e92e91e3d3035ce48059fc",
			enabled:false,
			name:"Wannabe",
			artist:"Spice girls",
			audioPath:"/mp3/98959d757d14bc4924e92e91e3d3035ce48059fc.mp3",
		});
		tracks.push({
			id:"c0984bf089f7e7534d6c838fd4204cc40ed87368",
			enabled:false,
			name:"Sk8er Boi",
			artist:"Avril Lavigne",
			audioPath:"/mp3/c0984bf089f7e7534d6c838fd4204cc40ed87368.mp3",
		});
		tracks.push({
			id:"f48d5786b2115ef778856979ab8823072c0d8a7c",
			enabled:false,
			name:"Total Eclipse of the Heart",
			artist:"Bonnie Tyler",
			audioPath:"/mp3/f48d5786b2115ef778856979ab8823072c0d8a7c.mp3",
		});
		tracks.push({
			id:"75d3d091213d60d9f3ed2c0698b846177076b0d0",
			enabled:false,
			name:"Careless Whisper",
			artist:"George Michael",
			audioPath:"/mp3/75d3d091213d60d9f3ed2c0698b846177076b0d0.mp3",
		});
		tracks.push({
			id:"5299497db5ba226f388f3a064064cc44b2b51568",
			enabled:false,
			name:"Gangsta's Paradise",
			artist:"Coolio",
			audioPath:"/mp3/5299497db5ba226f388f3a064064cc44b2b51568.mp3",
		});
		tracks.push({
			id:"48a875fc1117e0c027571813c3c65b7c4fe52cfa",
			enabled:false,
			name:"Wonderwall",
			artist:"Oasis",
			audioPath:"/mp3/48a875fc1117e0c027571813c3c65b7c4fe52cfa.mp3",
		});
		tracks.push({
			id:"a0aaadd12a0a4c8d925411ed687e5aa0145b2a22",
			enabled:false,
			name:"Every Breath You Take",
			artist:"The Police",
			audioPath:"/mp3/a0aaadd12a0a4c8d925411ed687e5aa0145b2a22.mp3",
		});
		tracks.push({
			id:"4929799672010ba499c49392f6007f3f017325a4",
			enabled:false,
			name:"Born in the U.S.A.",
			artist:"Bruce Springsteen",
			audioPath:"/mp3/4929799672010ba499c49392f6007f3f017325a4.mp3",
		});
		tracks.push({
			id:"d1c143357d86d1736806ed7404b71a44feb8451d",
			enabled:false,
			name:"Wake Me up Before You Go-Go",
			artist:"Wham!",
			audioPath:"/mp3/d1c143357d86d1736806ed7404b71a44feb8451d.mp3",
		});
		return tracks;
	}

	public static promisedTimeout(delay:number):Promise<void> {
		return new Promise(function(resolve) {
			setTimeout(_=>resolve(), delay);
		})
	}
	
	/**
	 * Computes the luminance of a color.
	 * @param color 
	 * @returns value between 0 (dark) and 1 (bright)
	 */
	public static getLuminance(color:number|string):number {
		let R,G,B;
		if(typeof color == "string") color = parseInt(color.replace(/#/gi, ""), 16);
		color = color & 0xffffff;//Strip out potential alpha channel
		R = (color >> 16) & 0xff;
		G = (color >> 8) & 0xff;
		B = (color) & 0xff;
		// return (0.299*R + 0.587*G + 0.114*B) / 255;
		return (0.2126*R + 0.7152*G + 0.0722*B) / 255;
	}

	/**
	 * Parse all matched routes from last to first to check
	 * for a meta prop and return it.
	 * 
	 * @param route 
	 * @param metaKey 
	 */
	public static getRouteMetaValue(route:Route, metaKey:string):any {
		let res = null;
		for (let i = route.matched.length-1; i >= 0; i--) {
			const v = route.matched[i].meta[metaKey];
			if(v === undefined) continue;
			res = v;
			break;
		}
		return res;
	}
}