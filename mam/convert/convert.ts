namespace $ {

	export class $mam_convert extends $mol_object2 {

		@ $mol_mem
		build() {
			return undefined as any as $mam_build
		}
		
		sources() {
			return this.build().sources_all()
		}

		generated() {
			return undefined as any as $mol_file[]
		}

	}

}
