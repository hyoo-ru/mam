namespace $ {

	export class $mam_bundle_js_node_test extends $mam_bundle_js {

		@ $mol_mem
		prefix() {
			return super.prefix() + 'node.test'
		}

		@ $mol_mem
		sources() {
			return super.sources().filter(
				file => !/\.web\.$/.test( file.name() )
			)
		}

	}

}
