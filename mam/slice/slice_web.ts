namespace $ {

	export class $mam_slice_web extends $mam_slice {

		filter( file : $mol_file ) {
			if( !super.filter( file ) ) return false
			if( /\.node\./.test( file.name() ) ) return false
			return true
		}

		prefix() {
			return 'web'
		}

	}

	export class $mam_slice_web_prod extends $mam_slice_web {

		@ $mol_mem
		bundle_classes(): ( typeof $mam_bundle )[] {
			return [
				this.$.$mam_bundle_meta,
				this.$.$mam_bundle_js,
				this.$.$mam_bundle_dts,
				this.$.$mam_bundle_index_html,
				this.$.$mam_bundle_test_html,
				this.$.$mam_bundle_readme,
				this.$.$mam_bundle_audit_js,
				this.$.$mam_bundle_css,
				this.$.$mam_bundle_files,
				this.$.$mam_bundle_locale,
				this.$.$mam_bundle_meta_tree,
				this.$.$mam_bundle_mjs,
				this.$.$mam_bundle_package_json,
				this.$.$mam_bundle_view_tree,
			]
		}

		filter( file : $mol_file ) {
			if( !super.filter( file ) ) return false
			if( /\.test\./.test( file.name() ) ) return false
			return true
		}
		
	}

	export class $mam_slice_web_test extends $mam_slice_web {

		prefix() {
			return 'web.test'
		}

		@ $mol_mem
		bundle_classes() {
			return [
				this.$.$mam_bundle_js,
				this.$.$mam_bundle_dts,
				this.$.$mam_bundle_audit_js,
			]
		}

		@ $mol_mem
		files() {
			
			const all = super.files()
			const prod = this.pack().slice( this.$.$mam_slice_web_prod ).files()
			
			const test = new Set< $mol_file >()

			for( const file of all ) {
				if( prod.has( file ) ) continue
				test.add( file )
			}

			return test
		}

	}

}
