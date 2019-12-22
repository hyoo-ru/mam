namespace $ {

	export class $mam_source_tsx extends $mam_source_ts {

		suffix = 'tsx'

		@ $mol_mem_key
		deps( source : $mol_file ) {
			// extract dependencies
			return undefined as any as Map< $mol_file , number >
		}

	}

}
