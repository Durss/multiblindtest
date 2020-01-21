import * as os from "os";
/**
 * Created by François
 */
export default class Utils  {

	/**
	 * Computes distance between two strings
	 *
	 * @param a
	 * @param b
	 * @returns {number}
	 */
	public static levenshtein(a:string, b:string):number {
		if(a.length == 0) return b.length;
		if(b.length == 0) return a.length;

		let matrix:number[][] = [];
		a = this.replaceDiacritics(a);
		b = this.replaceDiacritics(b);

		// increment along the first column of each row
		let i:number;
		for(i = 0; i <= b.length; i++){
			matrix[i] = [i];
		}

		// increment each column in the first row
		let j:number;
		for(j = 0; j <= a.length; j++){
			matrix[0][j] = j;
		}

		// Fill in the rest of the matrix
		for(i = 1; i <= b.length; i++){
			for(j = 1; j <= a.length; j++){
				if(b.charAt(i-1) == a.charAt(j-1)){
					matrix[i][j] = matrix[i-1][j-1];
				} else {
					matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, // substitution
						Math.min(matrix[i][j-1] + 1, // insertion
							matrix[i-1][j] + 1)); // deletion
				}
			}
		}

		// Logger.log("Levenshtein",a,b,matrix[b.length][a.length])
		return matrix[b.length][a.length];
	};

	/**
	 * Shortens
	 * @param src
	 * @param maxLength
	 * @returns {string}
	 */
	public static shorten(src:string, maxLength:number = 10):string {
		if(src.length > maxLength) {
			return src.substr(0, maxLength-1) + "…";
		}else{
			return src;
		}
	}

	/**
	 * Convers a string into a slug
	 *
	 * @param str
	 * @returns {string}
	 */
	public static slugify(str:string):string {
		if(!str || str.length == 0) return "";
		return this.replaceDiacritics(str.toLowerCase().trim())
			.replace(/[^\w\s-]/g, '') // remove non-word [a-z0-9_], non-whitespace, non-hyphen characters
			.replace(/[\s_-]+/g, '-') // swap any length of whitespace, underscore, hyphen characters with a single -
			.replace(/^-+|-+$/g, '')
			.replace(/&/g, '-and-');
	}

	/**
	 * Splits a string into multiple strings, each containing a maximum of N characters
	 *
	 * @param str
	 * @param maxLength
	 * @returns {string[]}
	 */
	public static smartSplitString(str:string, maxLength:number = 140):string[] {
		str = this.htmlEntityDecode(str).replace(/(<script(\s|\S)*?<\/script>)|(<style(\s|\S)*?<\/style>)|(<!--(\s|\S)*?-->)|(<\/?(\s|\S)*?>)/g, "");

		if(str.length < maxLength) return [str];

		let strings:string[] = [];
		let words:string[] = str.split(/(\r|\n|\s|\.|\?|!|,)/gm);
		let length:number = 0;
		let offset:number = 0;

		for(let i:number=0; i < words.length; i++) {
			if(i%2 == 1) continue;

			let w:string = words[i];
			if(length + w.length+1 > maxLength) {
				let line:string = str.substr(offset, length).trim();
				if(line.length > 0) {
					strings.push( line );
				}
				offset += length;
				length = 0;
				i-=2;
			}else{
				length += w.length + 1;
			}
		}

		if(offset < str.length) {
			let line:string = str.substr(offset, str.length - offset).trim();
			if(line.length > 0) strings.push( line );
		}

		return strings;
	}

	/**
	 * Shuffles an array
	 * Modifies the array
	 *
	 * @param a
	 */
	public static shuffle(a:any[]):void {
		for (let i:number = a.length; i; i--) {
			let j = Math.floor(Math.random() * i);
			[a[i - 1], a[j]] = [a[j], a[i - 1]];
		}
	}

	/**
	 * Decodes HTML entities
	 *
	 * @param text
	 * @returns {string}
	 */
	public static htmlEntityDecode(text:string):string {
		let entities:any[] = [
			['nbsp', ' '], ['Tab', '	'], ['NewLine', '\n'], ['excl', '!'], ['quot', '"'], ['num', '#'], ['dollar', '$'], ['percnt', '%'], ['amp', '&amp;'], ['apos', '\''], ['lpar', '('], ['rpar', ')'], ['ast', '*'], ['plus', '+'], ['comma', ','], ['period', '.'], ['sol', '/'], ['colon', ':'], ['semi', ';'], ['lt', '&lt;'], ['equals', '='], ['gt', '&gt;'], ['quest', '?'], ['commat', '@'], ['lsqb', '['], ['bsol', '\\'], ['rsqb', ']'], ['Hat', '^'], ['lowbar', '_'], ['grave', '`'], ['lcub', '{'], ['verbar', '|'], ['rcub', '}'], ['nbsp', '&nbsp;'], ['iexcl', '¡'], ['cent', '¢'], ['pound', '£'], ['curren', '¤'], ['yen', '¥'], ['brvbar', '¦'], ['sect', '§'], ['Dot', '¨'], ['copy', '©'], ['ordf', 'ª'], ['laquo', '«'], ['not', '¬'], ['shy', '­'], ['reg', '®'], ['macr', '¯'], ['deg', '°'], ['plusmn', '±'], ['sup2', '²'], ['sup3', '³'], ['acute', '´'], ['micro', 'µ'], ['para', '¶'], ['middot', '·'], ['cedil', '¸'], ['sup1', '¹'], ['ordm', 'º'], ['raquo', '»'], ['frac14', '¼'], ['frac12', '½'], ['frac34', '¾'], ['iquest', '¿'], ['Agrave', 'À'], ['Aacute', 'Á'], ['Acirc', 'Â'], ['Atilde', 'Ã'], ['Auml', 'Ä'], ['Aring', 'Å'], ['AElig', 'Æ'], ['Ccedil', 'Ç'], ['Egrave', 'È'], ['Eacute', 'É'], ['Ecirc', 'Ê'], ['Euml', 'Ë'], ['Igrave', 'Ì'], ['Iacute', 'Í'], ['Icirc', 'Î'], ['Iuml', 'Ï'], ['ETH', 'Ð'], ['Ntilde', 'Ñ'], ['Ograve', 'Ò'], ['Oacute', 'Ó'], ['Ocirc', 'Ô'], ['Otilde', 'Õ'], ['Ouml', 'Ö'], ['times', '×'], ['Oslash', 'Ø'], ['Ugrave', 'Ù'], ['Uacute', 'Ú'], ['Ucirc', 'Û'], ['Uuml', 'Ü'], ['Yacute', 'Ý'], ['THORN', 'Þ'], ['szlig', 'ß'], ['agrave', 'à'], ['aacute', 'á'], ['acirc', 'â'], ['atilde', 'ã'], ['auml', 'ä'], ['aring', 'å'], ['aelig', 'æ'], ['ccedil', 'ç'], ['egrave', 'è'], ['eacute', 'é'], ['ecirc', 'ê'], ['euml', 'ë'], ['igrave', 'ì'], ['iacute', 'í'], ['icirc', 'î'], ['iuml', 'ï'], ['eth', 'ð'], ['ntilde', 'ñ'], ['ograve', 'ò'], ['oacute', 'ó'], ['ocirc', 'ô'], ['otilde', 'õ'], ['ouml', 'ö'], ['divide', '÷'], ['oslash', 'ø'], ['ugrave', 'ù'], ['uacute', 'ú'], ['ucirc', 'û'], ['uuml', 'ü'], ['yacute', 'ý'], ['thorn', 'þ'], ['yuml', 'ÿ'], ['Amacr', 'Ā'], ['amacr', 'ā'], ['Abreve', 'Ă'], ['abreve', 'ă'], ['Aogon', 'Ą'], ['aogon', 'ą'], ['Cacute', 'Ć'], ['cacute', 'ć'], ['Ccirc', 'Ĉ'], ['ccirc', 'ĉ'], ['Cdot', 'Ċ'], ['cdot', 'ċ'], ['Ccaron', 'Č'], ['ccaron', 'č'], ['Dcaron', 'Ď'], ['dcaron', 'ď'], ['Dstrok', 'Đ'], ['dstrok', 'đ'], ['Emacr', 'Ē'], ['emacr', 'ē'], ['Edot', 'Ė'], ['edot', 'ė'], ['Eogon', 'Ę'], ['eogon', 'ę'], ['Ecaron', 'Ě'], ['ecaron', 'ě'], ['Gcirc', 'Ĝ'], ['gcirc', 'ĝ'], ['Gbreve', 'Ğ'], ['gbreve', 'ğ'], ['Gdot', 'Ġ'], ['gdot', 'ġ'], ['Gcedil', 'Ģ'], ['Hcirc', 'Ĥ'], ['hcirc', 'ĥ'], ['Hstrok', 'Ħ'], ['hstrok', 'ħ'], ['Itilde', 'Ĩ'], ['itilde', 'ĩ'], ['Imacr', 'Ī'], ['imacr', 'ī'], ['Iogon', 'Į'], ['iogon', 'į'], ['Idot', 'İ'], ['imath', 'ı'], ['IJlig', 'Ĳ'], ['ijlig', 'ĳ'], ['Jcirc', 'Ĵ'], ['jcirc', 'ĵ'], ['Kcedil', 'Ķ'], ['kcedil', 'ķ'], ['kgreen', 'ĸ'], ['Lacute', 'Ĺ'], ['lacute', 'ĺ'], ['Lcedil', 'Ļ'], ['lcedil', 'ļ'], ['Lcaron', 'Ľ'], ['lcaron', 'ľ'], ['Lmidot', 'Ŀ'], ['lmidot', 'ŀ'], ['Lstrok', 'Ł'], ['lstrok', 'ł'], ['Nacute', 'Ń'], ['nacute', 'ń'], ['Ncedil', 'Ņ'], ['ncedil', 'ņ'], ['Ncaron', 'Ň'], ['ncaron', 'ň'], ['napos', 'ŉ'], ['ENG', 'Ŋ'], ['eng', 'ŋ'], ['Omacr', 'Ō'], ['omacr', 'ō'], ['Odblac', 'Ő'], ['odblac', 'ő'], ['OElig', 'Œ'], ['oelig', 'œ'], ['Racute', 'Ŕ'], ['racute', 'ŕ'], ['Rcedil', 'Ŗ'], ['rcedil', 'ŗ'], ['Rcaron', 'Ř'], ['rcaron', 'ř'], ['Sacute', 'Ś'], ['sacute', 'ś'], ['Scirc', 'Ŝ'], ['scirc', 'ŝ'], ['Scedil', 'Ş'], ['scedil', 'ş'], ['Scaron', 'Š'], ['scaron', 'š'], ['Tcedil', 'Ţ'], ['tcedil', 'ţ'], ['Tcaron', 'Ť'], ['tcaron', 'ť'], ['Tstrok', 'Ŧ'], ['tstrok', 'ŧ'], ['Utilde', 'Ũ'], ['utilde', 'ũ'], ['Umacr', 'Ū'], ['umacr', 'ū'], ['Ubreve', 'Ŭ'], ['ubreve', 'ŭ'], ['Uring', 'Ů'], ['uring', 'ů'], ['Udblac', 'Ű'], ['udblac', 'ű'], ['Uogon', 'Ų'], ['uogon', 'ų'], ['Wcirc', 'Ŵ'], ['wcirc', 'ŵ'], ['Ycirc', 'Ŷ'], ['ycirc', 'ŷ'], ['Yuml', 'Ÿ'], ['Zacute', 'Ź'], ['zacute', 'ź'], ['Zdot', 'Ż'], ['zdot', 'ż'], ['Zcaron', 'Ž'], ['zcaron', 'ž'], ['fnof', 'ƒ'], ['imped', 'Ƶ'], ['gacute', 'ǵ'], ['jmath', 'ȷ'], ['circ', 'ˆ'], ['caron', 'ˇ'], ['breve', '˘'], ['dot', '˙'], ['ring', '˚'], ['ogon', '˛'], ['tilde', '˜'], ['dblac', '˝'], ['DownBreve', '̑'], ['UnderBar', '̲'], ['Alpha', 'Α'], ['Beta', 'Β'], ['Gamma', 'Γ'], ['Delta', 'Δ'], ['Epsilon', 'Ε'], ['Zeta', 'Ζ'], ['Eta', 'Η'], ['Theta', 'Θ'], ['Iota', 'Ι'], ['Kappa', 'Κ'], ['Lambda', 'Λ'], ['Mu', 'Μ'], ['Nu', 'Ν'], ['Xi', 'Ξ'], ['Omicron', 'Ο'], ['Pi', 'Π'], ['Rho', 'Ρ'], ['Sigma', 'Σ'], ['Tau', 'Τ'], ['Upsilon', 'Υ'], ['Phi', 'Φ'], ['Chi', 'Χ'], ['Psi', 'Ψ'], ['Omega', 'Ω'], ['alpha', 'α'], ['beta', 'β'], ['gamma', 'γ'], ['delta', 'δ'], ['epsiv', 'ε'], ['zeta', 'ζ'], ['eta', 'η'], ['theta', 'θ'], ['iota', 'ι'], ['kappa', 'κ'], ['lambda', 'λ'], ['mu', 'μ'], ['nu', 'ν'], ['xi', 'ξ'], ['omicron', 'ο'], ['pi', 'π'], ['rho', 'ρ'], ['sigmav', 'ς'], ['sigma', 'σ'], ['tau', 'τ'], ['upsi', 'υ'], ['phi', 'φ'], ['chi', 'χ'], ['psi', 'ψ'], ['omega', 'ω'], ['thetav', 'ϑ'], ['Upsi', 'ϒ'], ['straightphi', 'ϕ'], ['piv', 'ϖ'], ['Gammad', 'Ϝ'], ['gammad', 'ϝ'], ['kappav', 'ϰ'], ['rhov', 'ϱ'], ['epsi', 'ϵ'], ['bepsi', '϶'], ['IOcy', 'Ё'], ['DJcy', 'Ђ'], ['GJcy', 'Ѓ'], ['Jukcy', 'Є'], ['DScy', 'Ѕ'], ['Iukcy', 'І'], ['YIcy', 'Ї'], ['Jsercy', 'Ј'], ['LJcy', 'Љ'], ['NJcy', 'Њ'], ['TSHcy', 'Ћ'], ['KJcy', 'Ќ'], ['Ubrcy', 'Ў'], ['DZcy', 'Џ'], ['Acy', 'А'], ['Bcy', 'Б'], ['Vcy', 'В'], ['Gcy', 'Г'], ['Dcy', 'Д'], ['IEcy', 'Е'], ['ZHcy', 'Ж'], ['Zcy', 'З'], ['Icy', 'И'], ['Jcy', 'Й'], ['Kcy', 'К'], ['Lcy', 'Л'], ['Mcy', 'М'], ['Ncy', 'Н'], ['Ocy', 'О'], ['Pcy', 'П'], ['Rcy', 'Р'], ['Scy', 'С'], ['Tcy', 'Т'], ['Ucy', 'У'], ['Fcy', 'Ф'], ['KHcy', 'Х'], ['TScy', 'Ц'], ['CHcy', 'Ч'], ['SHcy', 'Ш'], ['SHCHcy', 'Щ'], ['HARDcy', 'Ъ'], ['Ycy', 'Ы'], ['SOFTcy', 'Ь'], ['Ecy', 'Э'], ['YUcy', 'Ю'], ['YAcy', 'Я'], ['acy', 'а'], ['bcy', 'б'], ['vcy', 'в'], ['gcy', 'г'], ['dcy', 'д'], ['iecy', 'е'], ['zhcy', 'ж'], ['zcy', 'з'], ['icy', 'и'], ['jcy', 'й'], ['kcy', 'к'], ['lcy', 'л'], ['mcy', 'м'], ['ncy', 'н'], ['ocy', 'о'], ['pcy', 'п'], ['rcy', 'р'], ['scy', 'с'], ['tcy', 'т'], ['ucy', 'у'], ['fcy', 'ф'], ['khcy', 'х'], ['tscy', 'ц'], ['chcy', 'ч'], ['shcy', 'ш'], ['shchcy', 'щ'], ['hardcy', 'ъ'], ['ycy', 'ы'], ['softcy', 'ь'], ['ecy', 'э'], ['yucy', 'ю'], ['yacy', 'я'], ['iocy', 'ё'], ['djcy', 'ђ'], ['gjcy', 'ѓ'], ['jukcy', 'є'], ['dscy', 'ѕ'], ['iukcy', 'і'], ['yicy', 'ї'], ['jsercy', 'ј'], ['ljcy', 'љ'], ['njcy', 'њ'], ['tshcy', 'ћ'], ['kjcy', 'ќ'], ['ubrcy', 'ў'], ['dzcy', 'џ'], ['ensp', ' '], ['emsp', ' '], ['emsp13', ' '], ['emsp14', ' '], ['numsp', ' '], ['puncsp', ' '], ['thinsp', ' '], ['hairsp', ' '], ['ZeroWidthSpace', '​'], ['zwnj', '‌'], ['zwj', '‍'], ['lrm', '‎'], ['rlm', '‏'], ['hyphen', '‐'], ['ndash', '–'], ['mdash', '—'], ['horbar', '―'], ['Verbar', '‖'], ['lsquo', '‘'], ['rsquo', '’'], ['lsquor', '‚'], ['ldquo', '“'], ['rdquo', '”'], ['ldquor', '„'], ['dagger', '†'], ['Dagger', '‡'], ['bull', '•'], ['nldr', '‥'], ['hellip', '…'], ['permil', '‰'], ['pertenk', '‱'], ['prime', '′'], ['Prime', '″'], ['tprime', '‴'], ['bprime', '‵'], ['lsaquo', '‹'], ['rsaquo', '›'], ['oline', '‾'], ['caret', '⁁'], ['hybull', '⁃'], ['frasl', '⁄'], ['bsemi', '⁏'], ['qprime', '⁗'], ['MediumSpace', ' '], ['NoBreak', '⁠'], ['ApplyFunction', '⁡'], ['InvisibleTimes', '⁢'], ['InvisibleComma', '⁣'], ['euro', '€'], ['tdot', '⃛'], ['DotDot', '⃜'], ['Copf', 'ℂ'], ['incare', '℅'], ['gscr', 'ℊ'], ['hamilt', 'ℋ'], ['Hfr', 'ℌ'], ['quaternions', 'ℍ'], ['planckh', 'ℎ'], ['planck', 'ℏ'], ['Iscr', 'ℐ'], ['image', 'ℑ'], ['Lscr', 'ℒ'], ['ell', 'ℓ'], ['Nopf', 'ℕ'], ['numero', '№'], ['copysr', '℗'], ['weierp', '℘'], ['Popf', 'ℙ'], ['rationals', 'ℚ'], ['Rscr', 'ℛ'], ['real', 'ℜ'], ['reals', 'ℝ'], ['rx', '℞'], ['trade', '™'], ['integers', 'ℤ'], ['ohm', 'Ω'], ['mho', '℧'], ['Zfr', 'ℨ'], ['iiota', '℩'], ['angst', 'Å'], ['bernou', 'ℬ'], ['Cfr', 'ℭ'], ['escr', 'ℯ'], ['Escr', 'ℰ'], ['Fscr', 'ℱ'], ['phmmat', 'ℳ'], ['order', 'ℴ'], ['alefsym', 'ℵ'], ['beth', 'ℶ'], ['gimel', 'ℷ'], ['daleth', 'ℸ'], ['CapitalDifferentialD', 'ⅅ'], ['DifferentialD', 'ⅆ'], ['ExponentialE', 'ⅇ'], ['ImaginaryI', 'ⅈ'], ['frac13', '⅓'], ['frac23', '⅔'], ['frac15', '⅕'], ['frac25', '⅖'], ['frac35', '⅗'], ['frac45', '⅘'], ['frac16', '⅙'], ['frac56', '⅚'], ['frac18', '⅛'], ['frac38', '⅜'], ['frac58', '⅝'], ['frac78', '⅞'], ['larr', '←'], ['uarr', '↑'], ['rarr', '→'], ['darr', '↓'], ['harr', '↔'], ['varr', '↕'], ['nwarr', '↖'], ['nearr', '↗'], ['searr', '↘'], ['swarr', '↙'], ['nlarr', '↚'], ['nrarr', '↛'], ['rarrw', '↝'], ['Larr', '↞'], ['Uarr', '↟'], ['Rarr', '↠'], ['Darr', '↡'], ['larrtl', '↢'], ['rarrtl', '↣'], ['LeftTeeArrow', '↤'], ['UpTeeArrow', '↥'], ['map', '↦'], ['DownTeeArrow', '↧'], ['larrhk', '↩'], ['rarrhk', '↪'], ['larrlp', '↫'], ['rarrlp', '↬'], ['harrw', '↭'], ['nharr', '↮'], ['lsh', '↰'], ['rsh', '↱'], ['ldsh', '↲'], ['rdsh', '↳'], ['crarr', '↵'], ['cularr', '↶'], ['curarr', '↷'], ['olarr', '↺'], ['orarr', '↻'], ['lharu', '↼'], ['lhard', '↽'], ['uharr', '↾'], ['uharl', '↿'], ['rharu', '⇀'], ['rhard', '⇁'], ['dharr', '⇂'], ['dharl', '⇃'], ['rlarr', '⇄'], ['udarr', '⇅'], ['lrarr', '⇆'], ['llarr', '⇇'], ['uuarr', '⇈'], ['rrarr', '⇉'], ['ddarr', '⇊'], ['lrhar', '⇋'], ['rlhar', '⇌'], ['nlArr', '⇍'], ['nhArr', '⇎'], ['nrArr', '⇏'], ['lArr', '⇐'], ['uArr', '⇑'], ['rArr', '⇒'], ['dArr', '⇓'], ['hArr', '⇔'], ['vArr', '⇕'], ['nwArr', '⇖'], ['neArr', '⇗'], ['seArr', '⇘'], ['swArr', '⇙'], ['lAarr', '⇚'], ['rAarr', '⇛'], ['zigrarr', '⇝'], ['larrb', '⇤'], ['rarrb', '⇥'], ['duarr', '⇵'], ['loarr', '⇽'], ['roarr', '⇾'], ['hoarr', '⇿'], ['forall', '∀'], ['comp', '∁'], ['part', '∂'], ['exist', '∃'], ['nexist', '∄'], ['empty', '∅'], ['nabla', '∇'], ['isin', '∈'], ['notin', '∉'], ['niv', '∋'], ['notni', '∌'], ['prod', '∏'], ['coprod', '∐'], ['sum', '∑'], ['minus', '−'], ['mnplus', '∓'], ['plusdo', '∔'], ['setmn', '∖'], ['lowast', '∗'], ['compfn', '∘'], ['radic', '√'], ['prop', '∝'], ['infin', '∞'], ['angrt', '∟'], ['ang', '∠'], ['angmsd', '∡'], ['angsph', '∢'], ['mid', '∣'], ['nmid', '∤'], ['par', '∥'], ['npar', '∦'], ['and', '∧'], ['or', '∨'], ['cap', '∩'], ['cup', '∪'], ['int', '∫'], ['Int', '∬'], ['tint', '∭'], ['conint', '∮'], ['Conint', '∯'], ['Cconint', '∰'], ['cwint', '∱'], ['cwconint', '∲'], ['awconint', '∳'], ['there4', '∴'], ['becaus', '∵'], ['ratio', '∶'], ['Colon', '∷'], ['minusd', '∸'], ['mDDot', '∺'], ['homtht', '∻'], ['sim', '∼'], ['bsim', '∽'], ['ac', '∾'], ['acd', '∿'], ['wreath', '≀'], ['nsim', '≁'], ['esim', '≂'], ['sime', '≃'], ['nsime', '≄'], ['cong', '≅'], ['simne', '≆'], ['ncong', '≇'], ['asymp', '≈'], ['nap', '≉'], ['ape', '≊'], ['apid', '≋'], ['bcong', '≌'], ['asympeq', '≍'], ['bump', '≎'], ['bumpe', '≏'], ['esdot', '≐'], ['eDot', '≑'], ['efDot', '≒'], ['erDot', '≓'], ['colone', '≔'], ['ecolon', '≕'], ['ecir', '≖'], ['cire', '≗'], ['wedgeq', '≙'], ['veeeq', '≚'], ['trie', '≜'], ['equest', '≟'], ['ne', '≠'], ['equiv', '≡'], ['nequiv', '≢'], ['le', '≤'], ['ge', '≥'], ['lE', '≦'], ['gE', '≧'], ['lnE', '≨'], ['gnE', '≩'], ['Lt', '≪'], ['Gt', '≫'], ['twixt', '≬'], ['NotCupCap', '≭'], ['nlt', '≮'], ['ngt', '≯'], ['nle', '≰'], ['nge', '≱'], ['lsim', '≲'], ['gsim', '≳'], ['nlsim', '≴'], ['ngsim', '≵'], ['lg', '≶'], ['gl', '≷'], ['ntlg', '≸'], ['ntgl', '≹'], ['pr', '≺'], ['sc', '≻'], ['prcue', '≼'], ['sccue', '≽'], ['prsim', '≾'], ['scsim', '≿'], ['npr', '⊀'], ['nsc', '⊁'], ['sub', '⊂'], ['sup', '⊃'], ['nsub', '⊄'], ['nsup', '⊅'], ['sube', '⊆'], ['supe', '⊇'], ['nsube', '⊈'], ['nsupe', '⊉'], ['subne', '⊊'], ['supne', '⊋'], ['cupdot', '⊍'], ['uplus', '⊎'], ['sqsub', '⊏'], ['sqsup', '⊐'], ['sqsube', '⊑'], ['sqsupe', '⊒'], ['sqcap', '⊓'], ['sqcup', '⊔'], ['oplus', '⊕'], ['ominus', '⊖'], ['otimes', '⊗'], ['osol', '⊘'], ['odot', '⊙'], ['ocir', '⊚'], ['oast', '⊛'], ['odash', '⊝'], ['plusb', '⊞'], ['minusb', '⊟'], ['timesb', '⊠'], ['sdotb', '⊡'], ['vdash', '⊢'], ['dashv', '⊣'], ['top', '⊤'], ['bottom', '⊥'], ['models', '⊧'], ['vDash', '⊨'], ['Vdash', '⊩'], ['Vvdash', '⊪'], ['VDash', '⊫'], ['nvdash', '⊬'], ['nvDash', '⊭'], ['nVdash', '⊮'], ['nVDash', '⊯'], ['prurel', '⊰'], ['vltri', '⊲'], ['vrtri', '⊳'], ['ltrie', '⊴'], ['rtrie', '⊵'], ['origof', '⊶'], ['imof', '⊷'], ['mumap', '⊸'], ['hercon', '⊹'], ['intcal', '⊺'], ['veebar', '⊻'], ['barvee', '⊽'], ['angrtvb', '⊾'], ['lrtri', '⊿'], ['xwedge', '⋀'], ['xvee', '⋁'], ['xcap', '⋂'], ['xcup', '⋃'], ['diam', '⋄'], ['sdot', '⋅'], ['sstarf', '⋆'], ['divonx', '⋇'], ['bowtie', '⋈'], ['ltimes', '⋉'], ['rtimes', '⋊'], ['lthree', '⋋'], ['rthree', '⋌'], ['bsime', '⋍'], ['cuvee', '⋎'], ['cuwed', '⋏'], ['Sub', '⋐'], ['Sup', '⋑'], ['Cap', '⋒'], ['Cup', '⋓'], ['fork', '⋔'], ['epar', '⋕'], ['ltdot', '⋖'], ['gtdot', '⋗'], ['Ll', '⋘'], ['Gg', '⋙'], ['leg', '⋚'], ['gel', '⋛'], ['cuepr', '⋞'], ['cuesc', '⋟'], ['nprcue', '⋠'], ['nsccue', '⋡'], ['nsqsube', '⋢'], ['nsqsupe', '⋣'], ['lnsim', '⋦'], ['gnsim', '⋧'], ['prnsim', '⋨'], ['scnsim', '⋩'], ['nltri', '⋪'], ['nrtri', '⋫'], ['nltrie', '⋬'], ['nrtrie', '⋭'], ['vellip', '⋮'], ['ctdot', '⋯'], ['utdot', '⋰'], ['dtdot', '⋱'], ['disin', '⋲'], ['isinsv', '⋳'], ['isins', '⋴'], ['isindot', '⋵'], ['notinvc', '⋶'], ['notinvb', '⋷'], ['isinE', '⋹'], ['nisd', '⋺'], ['xnis', '⋻'], ['nis', '⋼'], ['notnivc', '⋽'], ['notnivb', '⋾'], ['barwed', '⌅'], ['Barwed', '⌆'], ['lceil', '⌈'], ['rceil', '⌉'], ['lfloor', '⌊'], ['rfloor', '⌋'], ['drcrop', '⌌'], ['dlcrop', '⌍'], ['urcrop', '⌎'], ['ulcrop', '⌏'], ['bnot', '⌐'], ['profline', '⌒'], ['profsurf', '⌓'], ['telrec', '⌕'], ['target', '⌖'], ['ulcorn', '⌜'], ['urcorn', '⌝'], ['dlcorn', '⌞'], ['drcorn', '⌟'], ['frown', '⌢'], ['smile', '⌣'], ['cylcty', '⌭'], ['profalar', '⌮'], ['topbot', '⌶'], ['ovbar', '⌽'], ['solbar', '⌿'], ['angzarr', '⍼'], ['lmoust', '⎰'], ['rmoust', '⎱'], ['tbrk', '⎴'], ['bbrk', '⎵'], ['bbrktbrk', '⎶'], ['OverParenthesis', '⏜'], ['UnderParenthesis', '⏝'], ['OverBrace', '⏞'], ['UnderBrace', '⏟'], ['trpezium', '⏢'], ['elinters', '⏧'], ['blank', '␣'], ['oS', 'Ⓢ'], ['boxh', '─'], ['boxv', '│'], ['boxdr', '┌'], ['boxdl', '┐'], ['boxur', '└'], ['boxul', '┘'], ['boxvr', '├'], ['boxvl', '┤'], ['boxhd', '┬'], ['boxhu', '┴'], ['boxvh', '┼'], ['boxH', '═'], ['boxV', '║'], ['boxdR', '╒'], ['boxDr', '╓'], ['boxDR', '╔'], ['boxdL', '╕'], ['boxDl', '╖'], ['boxDL', '╗'], ['boxuR', '╘'], ['boxUr', '╙'], ['boxUR', '╚'], ['boxuL', '╛'], ['boxUl', '╜'], ['boxUL', '╝'], ['boxvR', '╞'], ['boxVr', '╟'], ['boxVR', '╠'], ['boxvL', '╡'], ['boxVl', '╢'], ['boxVL', '╣'], ['boxHd', '╤'], ['boxhD', '╥'], ['boxHD', '╦'], ['boxHu', '╧'], ['boxhU', '╨'], ['boxHU', '╩'], ['boxvH', '╪'], ['boxVh', '╫'], ['boxVH', '╬'], ['uhblk', '▀'], ['lhblk', '▄'], ['block', '█'], ['blk14', '░'], ['blk12', '▒'], ['blk34', '▓'], ['squ', '□'], ['squf', '▪'], ['EmptyVerySmallSquare', '▫'], ['rect', '▭'], ['marker', '▮'], ['fltns', '▱'], ['xutri', '△'], ['utrif', '▴'], ['utri', '▵'], ['rtrif', '▸'], ['rtri', '▹'], ['xdtri', '▽'], ['dtrif', '▾'], ['dtri', '▿'], ['ltrif', '◂'], ['ltri', '◃'], ['loz', '◊'], ['cir', '○'], ['tridot', '◬'], ['xcirc', '◯'], ['ultri', '◸'], ['urtri', '◹'], ['lltri', '◺'], ['EmptySmallSquare', '◻'], ['FilledSmallSquare', '◼'], ['starf', '★'], ['star', '☆'], ['phone', '☎'], ['female', '♀'], ['male', '♂'], ['spades', '♠'], ['clubs', '♣'], ['hearts', '♥'], ['diams', '♦'], ['sung', '♪'], ['flat', '♭'], ['natur', '♮'], ['sharp', '♯'], ['check', '✓'], ['cross', '✗'], ['malt', '✠'], ['sext', '✶'], ['VerticalSeparator', '❘'], ['lbbrk', '❲'], ['rbbrk', '❳'], ['lobrk', '⟦'], ['robrk', '⟧'], ['lang', '⟨'], ['rang', '⟩'], ['Lang', '⟪'], ['Rang', '⟫'], ['loang', '⟬'], ['roang', '⟭'], ['xlarr', '⟵'], ['xrarr', '⟶'], ['xharr', '⟷'], ['xlArr', '⟸'], ['xrArr', '⟹'], ['xhArr', '⟺'], ['xmap', '⟼'], ['dzigrarr', '⟿'], ['nvlArr', '⤂'], ['nvrArr', '⤃'], ['nvHarr', '⤄'], ['Map', '⤅'], ['lbarr', '⤌'], ['rbarr', '⤍'], ['lBarr', '⤎'], ['rBarr', '⤏'], ['RBarr', '⤐'], ['DDotrahd', '⤑'], ['UpArrowBar', '⤒'], ['DownArrowBar', '⤓'], ['Rarrtl', '⤖'], ['latail', '⤙'], ['ratail', '⤚'], ['lAtail', '⤛'], ['rAtail', '⤜'], ['larrfs', '⤝'], ['rarrfs', '⤞'], ['larrbfs', '⤟'], ['rarrbfs', '⤠'], ['nwarhk', '⤣'], ['nearhk', '⤤'], ['searhk', '⤥'], ['swarhk', '⤦'], ['nwnear', '⤧'], ['nesear', '⤨'], ['seswar', '⤩'], ['swnwar', '⤪'], ['rarrc', '⤳'], ['cudarrr', '⤵'], ['ldca', '⤶'], ['rdca', '⤷'], ['cudarrl', '⤸'], ['larrpl', '⤹'], ['curarrm', '⤼'], ['cularrp', '⤽'], ['rarrpl', '⥅'], ['harrcir', '⥈'], ['Uarrocir', '⥉'], ['lurdshar', '⥊'], ['ldrushar', '⥋'], ['LeftRightVector', '⥎'], ['RightUpDownVector', '⥏'], ['DownLeftRightVector', '⥐'], ['LeftUpDownVector', '⥑'], ['LeftVectorBar', '⥒'], ['RightVectorBar', '⥓'], ['RightUpVectorBar', '⥔'], ['RightDownVectorBar', '⥕'], ['DownLeftVectorBar', '⥖'], ['DownRightVectorBar', '⥗'], ['LeftUpVectorBar', '⥘'], ['LeftDownVectorBar', '⥙'], ['LeftTeeVector', '⥚'], ['RightTeeVector', '⥛'], ['RightUpTeeVector', '⥜'], ['RightDownTeeVector', '⥝'], ['DownLeftTeeVector', '⥞'], ['DownRightTeeVector', '⥟'], ['LeftUpTeeVector', '⥠'], ['LeftDownTeeVector', '⥡'], ['lHar', '⥢'], ['uHar', '⥣'], ['rHar', '⥤'], ['dHar', '⥥'], ['luruhar', '⥦'], ['ldrdhar', '⥧'], ['ruluhar', '⥨'], ['rdldhar', '⥩'], ['lharul', '⥪'], ['llhard', '⥫'], ['rharul', '⥬'], ['lrhard', '⥭'], ['udhar', '⥮'], ['duhar', '⥯'], ['RoundImplies', '⥰'], ['erarr', '⥱'], ['simrarr', '⥲'], ['larrsim', '⥳'], ['rarrsim', '⥴'], ['rarrap', '⥵'], ['ltlarr', '⥶'], ['gtrarr', '⥸'], ['subrarr', '⥹'], ['suplarr', '⥻'], ['lfisht', '⥼'], ['rfisht', '⥽'], ['ufisht', '⥾'], ['dfisht', '⥿'], ['lopar', '⦅'], ['ropar', '⦆'], ['lbrke', '⦋'], ['rbrke', '⦌'], ['lbrkslu', '⦍'], ['rbrksld', '⦎'], ['lbrksld', '⦏'], ['rbrkslu', '⦐'], ['langd', '⦑'], ['rangd', '⦒'], ['lparlt', '⦓'], ['rpargt', '⦔'], ['gtlPar', '⦕'], ['ltrPar', '⦖'], ['vzigzag', '⦚'], ['vangrt', '⦜'], ['angrtvbd', '⦝'], ['ange', '⦤'], ['range', '⦥'], ['dwangle', '⦦'], ['uwangle', '⦧'], ['angmsdaa', '⦨'], ['angmsdab', '⦩'], ['angmsdac', '⦪'], ['angmsdad', '⦫'], ['angmsdae', '⦬'], ['angmsdaf', '⦭'], ['angmsdag', '⦮'], ['angmsdah', '⦯'], ['bemptyv', '⦰'], ['demptyv', '⦱'], ['cemptyv', '⦲'], ['raemptyv', '⦳'], ['laemptyv', '⦴'], ['ohbar', '⦵'], ['omid', '⦶'], ['opar', '⦷'], ['operp', '⦹'], ['olcross', '⦻'], ['odsold', '⦼'], ['olcir', '⦾'], ['ofcir', '⦿'], ['olt', '⧀'], ['ogt', '⧁'], ['cirscir', '⧂'], ['cirE', '⧃'], ['solb', '⧄'], ['bsolb', '⧅'], ['boxbox', '⧉'], ['trisb', '⧍'], ['rtriltri', '⧎'], ['LeftTriangleBar', '⧏'], ['RightTriangleBar', '⧐'], ['race', '⧚'], ['iinfin', '⧜'], ['infintie', '⧝'], ['nvinfin', '⧞'], ['eparsl', '⧣'], ['smeparsl', '⧤'], ['eqvparsl', '⧥'], ['lozf', '⧫'], ['RuleDelayed', '⧴'], ['dsol', '⧶'], ['xodot', '⨀'], ['xoplus', '⨁'], ['xotime', '⨂'], ['xuplus', '⨄'], ['xsqcup', '⨆'], ['qint', '⨌'], ['fpartint', '⨍'], ['cirfnint', '⨐'], ['awint', '⨑'], ['rppolint', '⨒'], ['scpolint', '⨓'], ['npolint', '⨔'], ['pointint', '⨕'], ['quatint', '⨖'], ['intlarhk', '⨗'], ['pluscir', '⨢'], ['plusacir', '⨣'], ['simplus', '⨤'], ['plusdu', '⨥'], ['plussim', '⨦'], ['plustwo', '⨧'], ['mcomma', '⨩'], ['minusdu', '⨪'], ['loplus', '⨭'], ['roplus', '⨮'], ['Cross', '⨯'], ['timesd', '⨰'], ['timesbar', '⨱'], ['smashp', '⨳'], ['lotimes', '⨴'], ['rotimes', '⨵'], ['otimesas', '⨶'], ['Otimes', '⨷'], ['odiv', '⨸'], ['triplus', '⨹'], ['triminus', '⨺'], ['tritime', '⨻'], ['iprod', '⨼'], ['amalg', '⨿'], ['capdot', '⩀'], ['ncup', '⩂'], ['ncap', '⩃'], ['capand', '⩄'], ['cupor', '⩅'], ['cupcap', '⩆'], ['capcup', '⩇'], ['cupbrcap', '⩈'], ['capbrcup', '⩉'], ['cupcup', '⩊'], ['capcap', '⩋'], ['ccups', '⩌'], ['ccaps', '⩍'], ['ccupssm', '⩐'], ['And', '⩓'], ['Or', '⩔'], ['andand', '⩕'], ['oror', '⩖'], ['orslope', '⩗'], ['andslope', '⩘'], ['andv', '⩚'], ['orv', '⩛'], ['andd', '⩜'], ['ord', '⩝'], ['wedbar', '⩟'], ['sdote', '⩦'], ['simdot', '⩪'], ['congdot', '⩭'], ['easter', '⩮'], ['apacir', '⩯'], ['apE', '⩰'], ['eplus', '⩱'], ['pluse', '⩲'], ['Esim', '⩳'], ['Colone', '⩴'], ['Equal', '⩵'], ['eDDot', '⩷'], ['equivDD', '⩸'], ['ltcir', '⩹'], ['gtcir', '⩺'], ['ltquest', '⩻'], ['gtquest', '⩼'], ['les', '⩽'], ['ges', '⩾'], ['lesdot', '⩿'], ['gesdot', '⪀'], ['lesdoto', '⪁'], ['gesdoto', '⪂'], ['lesdotor', '⪃'], ['gesdotol', '⪄'], ['lap', '⪅'], ['gap', '⪆'], ['lne', '⪇'], ['gne', '⪈'], ['lnap', '⪉'], ['gnap', '⪊'], ['lEg', '⪋'], ['gEl', '⪌'], ['lsime', '⪍'], ['gsime', '⪎'], ['lsimg', '⪏'], ['gsiml', '⪐'], ['lgE', '⪑'], ['glE', '⪒'], ['lesges', '⪓'], ['gesles', '⪔'], ['els', '⪕'], ['egs', '⪖'], ['elsdot', '⪗'], ['egsdot', '⪘'], ['el', '⪙'], ['eg', '⪚'], ['siml', '⪝'], ['simg', '⪞'], ['simlE', '⪟'], ['simgE', '⪠'], ['LessLess', '⪡'], ['GreaterGreater', '⪢'], ['glj', '⪤'], ['gla', '⪥'], ['ltcc', '⪦'], ['gtcc', '⪧'], ['lescc', '⪨'], ['gescc', '⪩'], ['smt', '⪪'], ['lat', '⪫'], ['smte', '⪬'], ['late', '⪭'], ['bumpE', '⪮'], ['pre', '⪯'], ['sce', '⪰'], ['prE', '⪳'], ['scE', '⪴'], ['prnE', '⪵'], ['scnE', '⪶'], ['prap', '⪷'], ['scap', '⪸'], ['prnap', '⪹'], ['scnap', '⪺'], ['Pr', '⪻'], ['Sc', '⪼'], ['subdot', '⪽'], ['supdot', '⪾'], ['subplus', '⪿'], ['supplus', '⫀'], ['submult', '⫁'], ['supmult', '⫂'], ['subedot', '⫃'], ['supedot', '⫄'], ['subE', '⫅'], ['supE', '⫆'], ['subsim', '⫇'], ['supsim', '⫈'], ['subnE', '⫋'], ['supnE', '⫌'], ['csub', '⫏'], ['csup', '⫐'], ['csube', '⫑'], ['csupe', '⫒'], ['subsup', '⫓'], ['supsub', '⫔'], ['subsub', '⫕'], ['supsup', '⫖'], ['suphsub', '⫗'], ['supdsub', '⫘'], ['forkv', '⫙'], ['topfork', '⫚'], ['mlcp', '⫛'], ['Dashv', '⫤'], ['Vdashl', '⫦'], ['Barv', '⫧'], ['vBar', '⫨'], ['vBarv', '⫩'], ['Vbar', '⫫'], ['Not', '⫬'], ['bNot', '⫭'], ['rnmid', '⫮'], ['cirmid', '⫯'], ['midcir', '⫰'], ['topcir', '⫱'], ['nhpar', '⫲'], ['parsim', '⫳'], ['parsl', '⫽'], ['fflig', 'ﬀ'], ['filig', 'ﬁ'], ['fllig', 'ﬂ'], ['ffilig', 'ﬃ'], ['ffllig', 'ﬄ'], ['Ascr', '𝒜'], ['Cscr', '𝒞'], ['Dscr', '𝒟'], ['Gscr', '𝒢'], ['Jscr', '𝒥'], ['Kscr', '𝒦'], ['Nscr', '𝒩'], ['Oscr', '𝒪'], ['Pscr', '𝒫'], ['Qscr', '𝒬'], ['Sscr', '𝒮'], ['Tscr', '𝒯'], ['Uscr', '𝒰'], ['Vscr', '𝒱'], ['Wscr', '𝒲'], ['Xscr', '𝒳'], ['Yscr', '𝒴'], ['Zscr', '𝒵'], ['ascr', '𝒶'], ['bscr', '𝒷'], ['cscr', '𝒸'], ['dscr', '𝒹'], ['fscr', '𝒻'], ['hscr', '𝒽'], ['iscr', '𝒾'], ['jscr', '𝒿'], ['kscr', '𝓀'], ['lscr', '𝓁'], ['mscr', '𝓂'], ['nscr', '𝓃'], ['pscr', '𝓅'], ['qscr', '𝓆'], ['rscr', '𝓇'], ['sscr', '𝓈'], ['tscr', '𝓉'], ['uscr', '𝓊'], ['vscr', '𝓋'], ['wscr', '𝓌'], ['xscr', '𝓍'], ['yscr', '𝓎'], ['zscr', '𝓏'], ['Afr', '𝔄'], ['Bfr', '𝔅'], ['Dfr', '𝔇'], ['Efr', '𝔈'], ['Ffr', '𝔉'], ['Gfr', '𝔊'], ['Jfr', '𝔍'], ['Kfr', '𝔎'], ['Lfr', '𝔏'], ['Mfr', '𝔐'], ['Nfr', '𝔑'], ['Ofr', '𝔒'], ['Pfr', '𝔓'], ['Qfr', '𝔔'], ['Sfr', '𝔖'], ['Tfr', '𝔗'], ['Ufr', '𝔘'], ['Vfr', '𝔙'], ['Wfr', '𝔚'], ['Xfr', '𝔛'], ['Yfr', '𝔜'], ['afr', '𝔞'], ['bfr', '𝔟'], ['cfr', '𝔠'], ['dfr', '𝔡'], ['efr', '𝔢'], ['ffr', '𝔣'], ['gfr', '𝔤'], ['hfr', '𝔥'], ['ifr', '𝔦'], ['jfr', '𝔧'], ['kfr', '𝔨'], ['lfr', '𝔩'], ['mfr', '𝔪'], ['nfr', '𝔫'], ['ofr', '𝔬'], ['pfr', '𝔭'], ['qfr', '𝔮'], ['rfr', '𝔯'], ['sfr', '𝔰'], ['tfr', '𝔱'], ['ufr', '𝔲'], ['vfr', '𝔳'], ['wfr', '𝔴'], ['xfr', '𝔵'], ['yfr', '𝔶'], ['zfr', '𝔷'], ['Aopf', '𝔸'], ['Bopf', '𝔹'], ['Dopf', '𝔻'], ['Eopf', '𝔼'], ['Fopf', '𝔽'], ['Gopf', '𝔾'], ['Iopf', '𝕀'], ['Jopf', '𝕁'], ['Kopf', '𝕂'], ['Lopf', '𝕃'], ['Mopf', '𝕄'], ['Oopf', '𝕆'], ['Sopf', '𝕊'], ['Topf', '𝕋'], ['Uopf', '𝕌'], ['Vopf', '𝕍'], ['Wopf', '𝕎'], ['Xopf', '𝕏'], ['Yopf', '𝕐'], ['aopf', '𝕒'], ['bopf', '𝕓'], ['copf', '𝕔'], ['dopf', '𝕕'], ['eopf', '𝕖'], ['fopf', '𝕗'], ['gopf', '𝕘'], ['hopf', '𝕙'], ['iopf', '𝕚'], ['jopf', '𝕛'], ['kopf', '𝕜'], ['lopf', '𝕝'], ['mopf', '𝕞'], ['nopf', '𝕟'], ['oopf', '𝕠'], ['popf', '𝕡'], ['qopf', '𝕢'], ['ropf', '𝕣'], ['sopf', '𝕤'], ['topf', '𝕥'], ['uopf', '𝕦'], ['vopf', '𝕧'], ['wopf', '𝕨'], ['xopf', '𝕩'], ['yopf', '𝕪'], ['zopf', '𝕫']
		];

		for (let i:number = 0, max = entities.length; i < max; ++i)
			text = text.replace(new RegExp('&'+entities[i][0]+';', 'g'), entities[i][1]);

		return text;
	}

	/**
	 * Removes diacritics chars from a string and replaces them by their equivalent.
	 *
	 * @param str
	 * @returns {string|any|void}
	 */
	public static replaceDiacritics(str:string):string {
		if(!this.diacriticsMap) this.initDiacritics();
		return str.replace(/[^\u0000-\u007E]/g, (a) => {
			return this.diacriticsMap[a] || a;
		});
	}


	private static defaultDiacriticsRemovalMap = [
		{
			'base': 'A',
			'letters': '\u0041\u24B6\uFF21\u00C0\u00C1\u00C2\u1EA6\u1EA4\u1EAA\u1EA8\u00C3\u0100\u0102\u1EB0\u1EAE\u1EB4\u1EB2\u0226\u01E0\u00C4\u01DE\u1EA2\u00C5\u01FA\u01CD\u0200\u0202\u1EA0\u1EAC\u1EB6\u1E00\u0104\u023A\u2C6F'
		},
		{'base': 'AA', 'letters': '\uA732'},
		{'base': 'AE', 'letters': '\u00C6\u01FC\u01E2'},
		{'base': 'AO', 'letters': '\uA734'},
		{'base': 'AU', 'letters': '\uA736'},
		{'base': 'AV', 'letters': '\uA738\uA73A'},
		{'base': 'AY', 'letters': '\uA73C'},
		{'base': 'B', 'letters': '\u0042\u24B7\uFF22\u1E02\u1E04\u1E06\u0243\u0182\u0181'},
		{'base': 'C', 'letters': '\u0043\u24B8\uFF23\u0106\u0108\u010A\u010C\u00C7\u1E08\u0187\u023B\uA73E'},
		{
			'base': 'D',
			'letters': '\u0044\u24B9\uFF24\u1E0A\u010E\u1E0C\u1E10\u1E12\u1E0E\u0110\u018B\u018A\u0189\uA779\u00D0'
		},
		{'base': 'DZ', 'letters': '\u01F1\u01C4'},
		{'base': 'Dz', 'letters': '\u01F2\u01C5'},
		{
			'base': 'E',
			'letters': '\u0045\u24BA\uFF25\u00C8\u00C9\u00CA\u1EC0\u1EBE\u1EC4\u1EC2\u1EBC\u0112\u1E14\u1E16\u0114\u0116\u00CB\u1EBA\u011A\u0204\u0206\u1EB8\u1EC6\u0228\u1E1C\u0118\u1E18\u1E1A\u0190\u018E'
		},
		{'base': 'F', 'letters': '\u0046\u24BB\uFF26\u1E1E\u0191\uA77B'},
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
		{'base': 'J', 'letters': '\u004A\u24BF\uFF2A\u0134\u0248'},
		{
			'base': 'K',
			'letters': '\u004B\u24C0\uFF2B\u1E30\u01E8\u1E32\u0136\u1E34\u0198\u2C69\uA740\uA742\uA744\uA7A2'
		},
		{
			'base': 'L',
			'letters': '\u004C\u24C1\uFF2C\u013F\u0139\u013D\u1E36\u1E38\u013B\u1E3C\u1E3A\u0141\u023D\u2C62\u2C60\uA748\uA746\uA780'
		},
		{'base': 'LJ', 'letters': '\u01C7'},
		{'base': 'Lj', 'letters': '\u01C8'},
		{'base': 'M', 'letters': '\u004D\u24C2\uFF2D\u1E3E\u1E40\u1E42\u2C6E\u019C'},
		{
			'base': 'N',
			'letters': '\u004E\u24C3\uFF2E\u01F8\u0143\u00D1\u1E44\u0147\u1E46\u0145\u1E4A\u1E48\u0220\u019D\uA790\uA7A4'
		},
		{'base': 'NJ', 'letters': '\u01CA'},
		{'base': 'Nj', 'letters': '\u01CB'},
		{
			'base': 'O',
			'letters': '\u004F\u24C4\uFF2F\u00D2\u00D3\u00D4\u1ED2\u1ED0\u1ED6\u1ED4\u00D5\u1E4C\u022C\u1E4E\u014C\u1E50\u1E52\u014E\u022E\u0230\u00D6\u022A\u1ECE\u0150\u01D1\u020C\u020E\u01A0\u1EDC\u1EDA\u1EE0\u1EDE\u1EE2\u1ECC\u1ED8\u01EA\u01EC\u00D8\u01FE\u0186\u019F\uA74A\uA74C'
		},
		{'base': 'OI', 'letters': '\u01A2'},
		{'base': 'OO', 'letters': '\uA74E'},
		{'base': 'OU', 'letters': '\u0222'},
		{'base': 'OE', 'letters': '\u008C\u0152'},
		{'base': 'oe', 'letters': '\u009C\u0153'},
		{'base': 'P', 'letters': '\u0050\u24C5\uFF30\u1E54\u1E56\u01A4\u2C63\uA750\uA752\uA754'},
		{'base': 'Q', 'letters': '\u0051\u24C6\uFF31\uA756\uA758\u024A'},
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
		{'base': 'TZ', 'letters': '\uA728'},
		{
			'base': 'U',
			'letters': '\u0055\u24CA\uFF35\u00D9\u00DA\u00DB\u0168\u1E78\u016A\u1E7A\u016C\u00DC\u01DB\u01D7\u01D5\u01D9\u1EE6\u016E\u0170\u01D3\u0214\u0216\u01AF\u1EEA\u1EE8\u1EEE\u1EEC\u1EF0\u1EE4\u1E72\u0172\u1E76\u1E74\u0244'
		},
		{'base': 'V', 'letters': '\u0056\u24CB\uFF36\u1E7C\u1E7E\u01B2\uA75E\u0245'},
		{'base': 'VY', 'letters': '\uA760'},
		{'base': 'W', 'letters': '\u0057\u24CC\uFF37\u1E80\u1E82\u0174\u1E86\u1E84\u1E88\u2C72'},
		{'base': 'X', 'letters': '\u0058\u24CD\uFF38\u1E8A\u1E8C'},
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
		{'base': 'aa', 'letters': '\uA733'},
		{'base': 'ae', 'letters': '\u00E6\u01FD\u01E3'},
		{'base': 'ao', 'letters': '\uA735'},
		{'base': 'au', 'letters': '\uA737'},
		{'base': 'av', 'letters': '\uA739\uA73B'},
		{'base': 'ay', 'letters': '\uA73D'},
		{'base': 'b', 'letters': '\u0062\u24D1\uFF42\u1E03\u1E05\u1E07\u0180\u0183\u0253'},
		{'base': 'c', 'letters': '\u0063\u24D2\uFF43\u0107\u0109\u010B\u010D\u00E7\u1E09\u0188\u023C\uA73F\u2184'},
		{
			'base': 'd',
			'letters': '\u0064\u24D3\uFF44\u1E0B\u010F\u1E0D\u1E11\u1E13\u1E0F\u0111\u018C\u0256\u0257\uA77A'
		},
		{'base': 'dz', 'letters': '\u01F3\u01C6'},
		{
			'base': 'e',
			'letters': '\u0065\u24D4\uFF45\u00E8\u00E9\u00EA\u1EC1\u1EBF\u1EC5\u1EC3\u1EBD\u0113\u1E15\u1E17\u0115\u0117\u00EB\u1EBB\u011B\u0205\u0207\u1EB9\u1EC7\u0229\u1E1D\u0119\u1E19\u1E1B\u0247\u025B\u01DD'
		},
		{'base': 'f', 'letters': '\u0066\u24D5\uFF46\u1E1F\u0192\uA77C'},
		{
			'base': 'g',
			'letters': '\u0067\u24D6\uFF47\u01F5\u011D\u1E21\u011F\u0121\u01E7\u0123\u01E5\u0260\uA7A1\u1D79\uA77F'
		},
		{
			'base': 'h',
			'letters': '\u0068\u24D7\uFF48\u0125\u1E23\u1E27\u021F\u1E25\u1E29\u1E2B\u1E96\u0127\u2C68\u2C76\u0265'
		},
		{'base': 'hv', 'letters': '\u0195'},
		{
			'base': 'i',
			'letters': '\u0069\u24D8\uFF49\u00EC\u00ED\u00EE\u0129\u012B\u012D\u00EF\u1E2F\u1EC9\u01D0\u0209\u020B\u1ECB\u012F\u1E2D\u0268\u0131'
		},
		{'base': 'j', 'letters': '\u006A\u24D9\uFF4A\u0135\u01F0\u0249'},
		{
			'base': 'k',
			'letters': '\u006B\u24DA\uFF4B\u1E31\u01E9\u1E33\u0137\u1E35\u0199\u2C6A\uA741\uA743\uA745\uA7A3'
		},
		{
			'base': 'l',
			'letters': '\u006C\u24DB\uFF4C\u0140\u013A\u013E\u1E37\u1E39\u013C\u1E3D\u1E3B\u017F\u0142\u019A\u026B\u2C61\uA749\uA781\uA747'
		},
		{'base': 'lj', 'letters': '\u01C9'},
		{'base': 'm', 'letters': '\u006D\u24DC\uFF4D\u1E3F\u1E41\u1E43\u0271\u026F'},
		{
			'base': 'n',
			'letters': '\u006E\u24DD\uFF4E\u01F9\u0144\u00F1\u1E45\u0148\u1E47\u0146\u1E4B\u1E49\u019E\u0272\u0149\uA791\uA7A5'
		},
		{'base': 'nj', 'letters': '\u01CC'},
		{
			'base': 'o',
			'letters': '\u006F\u24DE\uFF4F\u00F2\u00F3\u00F4\u1ED3\u1ED1\u1ED7\u1ED5\u00F5\u1E4D\u022D\u1E4F\u014D\u1E51\u1E53\u014F\u022F\u0231\u00F6\u022B\u1ECF\u0151\u01D2\u020D\u020F\u01A1\u1EDD\u1EDB\u1EE1\u1EDF\u1EE3\u1ECD\u1ED9\u01EB\u01ED\u00F8\u01FF\u0254\uA74B\uA74D\u0275'
		},
		{'base': 'oi', 'letters': '\u01A3'},
		{'base': 'ou', 'letters': '\u0223'},
		{'base': 'oo', 'letters': '\uA74F'},
		{'base': 'p', 'letters': '\u0070\u24DF\uFF50\u1E55\u1E57\u01A5\u1D7D\uA751\uA753\uA755'},
		{'base': 'q', 'letters': '\u0071\u24E0\uFF51\u024B\uA757\uA759'},
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
		{'base': 'tz', 'letters': '\uA729'},
		{
			'base': 'u',
			'letters': '\u0075\u24E4\uFF55\u00F9\u00FA\u00FB\u0169\u1E79\u016B\u1E7B\u016D\u00FC\u01DC\u01D8\u01D6\u01DA\u1EE7\u016F\u0171\u01D4\u0215\u0217\u01B0\u1EEB\u1EE9\u1EEF\u1EED\u1EF1\u1EE5\u1E73\u0173\u1E77\u1E75\u0289'
		},
		{'base': 'v', 'letters': '\u0076\u24E5\uFF56\u1E7D\u1E7F\u028B\uA75F\u028C'},
		{'base': 'vy', 'letters': '\uA761'},
		{'base': 'w', 'letters': '\u0077\u24E6\uFF57\u1E81\u1E83\u0175\u1E87\u1E85\u1E98\u1E89\u2C73'},
		{'base': 'x', 'letters': '\u0078\u24E7\uFF58\u1E8B\u1E8D'},
		{
			'base': 'y',
			'letters': '\u0079\u24E8\uFF59\u1EF3\u00FD\u0177\u1EF9\u0233\u1E8F\u00FF\u1EF7\u1E99\u1EF5\u01B4\u024F\u1EFF'
		},
		{'base': 'z', 'letters': '\u007A\u24E9\uFF5A\u017A\u1E91\u017C\u017E\u1E93\u1E95\u01B6\u0225\u0240\u2C6C\uA763'}
	];

	private static diacriticsMap:any = null;
	private static initDiacritics():void {
		this.diacriticsMap = {};
		for (let i = 0; i < this.defaultDiacriticsRemovalMap.length; i++) {
			let letters = this.defaultDiacriticsRemovalMap[i].letters;
			for (let j = 0; j < letters.length; j++) {
				this.diacriticsMap[letters[j]] = this.defaultDiacriticsRemovalMap[i].base;
			}
		}
	}

	/**
	 * Get the most similar local IP compared to the one given in parameters
	 */
	public static getMostSimilarIpFrom(ref:string):string {
		const getLocalExternalIPs = () => [].concat(...Object.values(os.networkInterfaces()))
		.filter(details => details.family === 'IPv4' && !details.internal).map(details => details.address);
		let ips = getLocalExternalIPs();
		let minDist = 9999999;
		let selected = null;
		ips.forEach(ip => {
			let dist = this.levenshtein(ref, ip);
			if(dist < minDist) {
				minDist = dist;
				selected = ip;
			}
		});
		return selected;
	}
}