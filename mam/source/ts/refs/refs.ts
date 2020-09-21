namespace $ {

	const { repeat_greedy , word_break , or , letter , repeat , byte , space } = $mol_regexp

	const bytes = repeat( byte )
	const word = repeat_greedy( letter , 1 )
	const spaces = repeat_greedy( space )
	
	const strings = < Regexp extends $mol_regexp_source >( regexp : Regexp )=> {
		
		const single = [ "'" , regexp , "'" ] as const
		const double = [ '"' , regexp , '"' ] as const
		
		return $mol_regexp.from([ single , or , double ])
	}

	export let $mam_source_ts_refs = $mol_regexp.from({

		/** @todo Add quote escaping support */
		string : strings( bytes ) ,

		fqn : [ '$' , { name : [ word , repeat_greedy([ /[._]/ , word ]) ] } ] ,
		
		req : [ word_break , 'require' , spaces , '(' , spaces , strings({ path : bytes }) , spaces , ')' ] ,

	})

}
