namespace $ {

	export class $mam_bundle_js_web extends $mam_bundle_js {

		@ $mol_mem
		prefix() {
			return super.prefix() + 'web'
		}

		@ $mol_mem
		sources() {
			return super.sources().filter(
				file => !/\.(node|test)\.$/.test( file.name() )
			)
		}

	}

}
