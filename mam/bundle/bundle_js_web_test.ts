namespace $ {

	export class $mam_bundle_js_web_test extends $mam_bundle_js {

		@ $mol_mem
		prefix() {
			return super.prefix() + 'web.test'
		}

		@ $mol_mem
		sources() {
			return super.sources().filter(
				file => !/\.node\.$/.test( file.name() )
			) // удалить всё, что есть в this.build().bundle( $mam_bundle_js_web ).sources()
		}

	}

}
