namespace $ {

	/** Source file transpiler. */
	export class $mam_convert extends $mol_object2 {

		static match( file: $mol_file ): boolean {
			return false
		}

		@ $mol_mem
		root() {
			return undefined as any as $mam_root
		}

		@ $mol_mem
		source() {
			return undefined as any as $mol_file
		}

		@ $mol_mem
		generated(): $mol_file[] {
			return []
		}

		/** Will be included in further processing (converting, deps searching) */
		@ $mol_mem
		promoted(): $mol_file[] {
			return []
		}

	}

}
