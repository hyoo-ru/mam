namespace $ {

	export class $mam_bundle_js_node extends $mam_bundle_js {

		@ $mol_mem
		prefix() {
			return super.prefix() + 'node'
		}

		@ $mol_mem
		sources() {
			return super.sources().filter(
				file => !/\.(web|test)\.$/.test( file.name() )
			)
		}

		generated() {
			// generate bundle
			return [ this.target() , this.target_map() ]
		}

	}

}
