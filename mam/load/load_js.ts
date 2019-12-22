namespace $ {

	export class $mam_load_js extends $mam_load {

		suffix = 'js'

		@ $mol_mem_key
		deps( source : $mol_file ) {
			// extract dependencies
			return undefined as any as Map< $mol_file , number >
		}

	}

}
