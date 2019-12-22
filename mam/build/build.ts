namespace $ {

	export class $mam_build extends $mol_object2 {

		@ $mol_mem
		root() {
			return $mol_file.relative( '.' )
		}

		@ $mol_mem
		entry( next? : $mol_file ) {
			return next!
		}

		@ $mol_mem
		output( next? : $mol_file ) {
			return this.entry().resolve( '-' )
		}

		@ $mol_mem
		sources_all() {
			return undefined as any as $mol_file[]
		}

		@ $mol_mem_key
		bundle( Bundle : typeof $mam_bundle ) {
			return Bundle.create(
				bundle => bundle.build = $mol_const( this )
			)
		}

		@ $mol_mem
		bundles() {
			return [
				this.bundle( $mam_bundle_js_web ) ,
				this.bundle( $mam_bundle_js_web_test ) ,
				this.bundle( $mam_bundle_js_node ) ,
				this.bundle( $mam_bundle_js_node_test ) ,
				this.bundle( $mam_bundle_dts ) ,
				this.bundle( $mam_bundle_meta ) ,
				this.bundle( $mam_bundle_locale ) ,
			]
		}

		@ $mol_mem
		bundle_mapping() {
			return undefined as any as Record< string , $mam_bundle >
		}

	}

}
