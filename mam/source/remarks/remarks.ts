namespace $ {
	
	const { repeat , char_any , line_end } = $mol_regexp

	export let $mam_source_remarks_js = $mol_regexp.from({
		inline : [ '//' , repeat( char_any ) , line_end ],
		block : [ '/*' , repeat( char_any ) , '*/' ],
	})

	export let $mam_source_remarks_css = $mol_regexp.from({
		block : [ '/*' , repeat( char_any ) , '*/' ],
	})

}
