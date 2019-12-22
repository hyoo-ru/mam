namespace $ {

	export class $mam_load extends $mol_object2 {

		@ $mol_mem
		build() {
			return undefined as any as $mam_build
		}

		suffix = ''
		
		@ $mol_mem_key
		deps( source : $mol_file ) {
			// extract dependencies
			return undefined as any as Map< $mol_file , number >
		}

	}

}
