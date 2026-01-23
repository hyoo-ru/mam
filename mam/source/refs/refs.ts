namespace $ {

	const { repeat_greedy, word_break_only, or, latin_only, repeat, char_any, space_only } = $mol_regexp

	const bytes = repeat( char_any )
	const word = repeat_greedy( latin_only, 1 )
	const spaces = repeat_greedy( space_only )
	
	const strings = < Regexp extends $mol_regexp_source >( regexp: Regexp )=> {
		
		const single = [ "'", regexp, "'" ] as const
		const double = [ '"', regexp, '"' ] as const
		
		return $mol_regexp.from([ single, or, double ])
	}

	export let $mam_source_refs_js = $mol_regexp.from({

		/** @todo Add quote escaping support */
		// string: strings( bytes ),

		fqn: [ '$', { name: [ word, repeat_greedy([ /[._]/, word ]) ] } ],
		
		req: [ word_break_only, 'require', spaces, '(', spaces, strings({ path: bytes }), spaces, ')' ],

	})

	export let $mam_source_refs_css = $mol_regexp.from({

		fqn: [ { name: [ word, repeat_greedy([ /[._]/, word ]) ] } ],
		
	})

}
