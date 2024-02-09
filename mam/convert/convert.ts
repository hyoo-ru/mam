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
		generated( source : $mol_file ): {
			file: $mol_file,
			search_deps: Boolean,
		}[] {
			return []
		}

	}

}
