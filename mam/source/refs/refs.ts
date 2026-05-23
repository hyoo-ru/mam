namespace $ {

	const { repeat_greedy, word_break_only, or, latin_only, space_only } = $mol_regexp

	const word = repeat_greedy( latin_only, 1 )
	const spaces = repeat_greedy( space_only )
	const spaces_req = repeat_greedy( space_only, 1 )
	const string_single = repeat_greedy( /[^']/ )
	const string_double = repeat_greedy( /[^"]/ )
	const path = [ "'", { path: string_single }, "'", or, '"', { path: string_double }, '"' ] as const

	export let $mam_source_refs_js = $mol_regexp.from({

		/** @todo Add quote escaping support */
		string: [ "'", string_single, "'", or, '"', string_double, '"' ],

		fqn: [ '$', { name: [ word, repeat_greedy([ /[._]/, word ]) ] } ],
		
		req: [ word_break_only, 'require', spaces, '(', spaces, path, spaces, ')' ],

		imp: [ word_break_only, 'import', word_break_only, [ spaces, '(', spaces, path, spaces, ')', or, spaces_req, repeat_greedy( /[^'"]/, 0 ), path ] ],

	})

	export let $mam_source_refs_css = $mol_regexp.from({

		attr: [ /(?:--|\[)/, { name: /[a-z][a-z0-9]*(?:_[a-z0-9]+)+/ } ],

		fqn: [ '$', { name: /[a-z][a-z0-9]*(?:[._][a-z0-9]+)+/ } ],
		
	}, { ignoreCase: true })

}
