namespace $ {

	/** Source file transpiler. */
	export class $mam_convert extends $mol_object2 {

		@ $mol_mem
		root() {
			return undefined as any as $mam_root
		}

		@ $mol_mem_key
		match( file : $mol_file ) {
			return false
		}

		@ $mol_mem_key
		generated( source : $mol_file ): $mol_file[] {
			return []
		}

		/** Will be included in further processing (converting, deps searching) */
		@ $mol_mem_key
		promoted( source : $mol_file ): $mol_file[] {
			return []
		}

	}

}
