namespace $ {

	export class $mam_slice_node extends $mam_slice {

		filter( file : $mol_file ) {
			if( !super.filter( file ) ) return false
			if( /\.web\./.test( file.name() ) ) return false
			return true
		}

		prefix() {
			return 'node'
		}

		@ $mol_mem
		node_deps() : string[] {
			
			var deps = new Set< string >()
			var sources = this.files()
			
			for( let src of sources ) {

				const deps = this.root().source( [ this.$.$mam_source_ts, src ] )?.ts_source_deps().node_deps
				deps?.forEach( dep => deps.add( dep ) )

			}

			return [ ... deps ]

		}

	}

	export class $mam_slice_node_prod extends $mam_slice_node {

		filter( file : $mol_file ) {
			if( !super.filter( file ) ) return false
			if( /\.test\./.test( file.name() ) ) return false
			return true
		}
		
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
		
	}

	export class $mam_slice_node_test extends $mam_slice_node {

		prefix() {
			return 'node.test'
		}

		@ $mol_mem
		bundle_classes() {
			return [
				this.$.$mam_bundle_js,
				this.$.$mam_bundle_dts,
				this.$.$mam_bundle_audit_js,
			]
		}

	}

}
