namespace $ {

	/** Makes one bundle from all required sources. */
	export class $mam_bundle extends $mol_object2 {

		@ $mol_mem
		slice() {
			return undefined as any as $mam_slice
		}

		prefix() {
			return this.slice().prefix()
		}
		
		pack() {
			return this.slice().pack()
		}

		@ $mol_mem
		files() {
			return [ ... this.slice().files() ]
		}
		
		generated() {
			return [] as $mol_file[]
		}

	}

}
