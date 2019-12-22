namespace $ {

	export class $mam_source_dir extends $mam_source {

		@ $mol_mem_key
		deps( source : $mol_file ) {
			// extract dependencies
			return undefined as any as Map< $mol_file , number >
		}

	}

}
