namespace $ {

	export class $mam_load_tsx extends $mam_load_ts {

		suffix = 'tsx'

		@ $mol_mem_key
		deps( source : $mol_file ) {
			return super.deps( source )
		}

	}

}
