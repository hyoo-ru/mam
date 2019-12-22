namespace $ {

	export class $mam_bundle_meta extends $mam_bundle {

		suffix() {
			return '.meta.json'
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
