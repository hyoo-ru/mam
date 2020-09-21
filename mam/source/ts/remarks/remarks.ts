namespace $ {
	
	const { repeat , byte , line_end } = $mol_regexp

	export let $mam_source_ts_remarks = $mol_regexp.from({
		inline : [ '//' , repeat( byte ) , line_end ],
		block : [ '/*' , repeat( byte ) , '*/' ],
	})

}
