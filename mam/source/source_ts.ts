namespace $ {

	export class $mam_source_ts extends $mam_source {

		suffix = 'ts'

		@ $mol_mem_key
		deps( source : $mol_file ) {
			// extract dependencies
			return undefined as any as Map< $mol_file , number >
		}

	}

}
