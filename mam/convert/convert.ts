namespace $ {

	export class $mam_convert extends $mol_object2 {

		@ $mol_mem
		root() {
			return undefined as any as $mam_root
		}

		@ $mol_mem_key
		generated( source : $mol_file ): $mol_file[] {
			return []
		}

		priority = {
			source: 1,
			generated: 0,
		}

	}

}
