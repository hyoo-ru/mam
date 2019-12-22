namespace $ {

	export class $mam_bundle_js extends $mam_bundle {

		suffix() {
			return '.js'
		}

		@ $mol_mem
		sources() {
			return super.sources().filter(
				file => /\.js$/.test( file.name() )
			)
		}

		@ $mol_mem
		target_map() {
			const target = this.target()
			return target.parent().resolve( target.name() + '.map' )
		}

		generated() {
			// generate bundle
			return [ this.target() , this.target_map() ]
		}

	}

}
