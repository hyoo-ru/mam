namespace $ {

	export class $mam_bundle_dts extends $mam_bundle {

		suffix() {
			return '.d.ts'
		}

		@ $mol_mem
		sources() {
			return super.sources().filter(
				file => /\.d.ts$/.test( file.name() )
			)
		}

		generated() {
			// generate bundle
			return [ this.target() ]
		}

	}
	
}
