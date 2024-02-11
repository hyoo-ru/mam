namespace $ {

	export class $mam_slice_node extends $mam_slice {

		filter( file: $mol_file ) {
			if( !super.filter( file ) ) return false
			if( /\.web\./.test( file.name() ) ) return false
			return true
		}

		prefix() {
			return 'node'
		}

		@ $mol_mem
		node_deps(): string[] {
			
			const deps = new Set< string >()
			const sources = this.files()
			
			for( let file of sources ) {
				
				const file_deps = this.root().source( [ this.$.$mam_source_ts, file ] )?.ts_source_deps().node_deps
				file_deps?.forEach( dep => deps.add( dep ) )

			}

			return [ ... deps ]

		}

	}

	export class $mam_slice_node_prod extends $mam_slice_node {

		filter( file: $mol_file ) {
			if( !super.filter( file ) ) return false
			if( /\.test\./.test( file.name() ) ) return false
			return true
		}
		
	}

	export class $mam_slice_node_test extends $mam_slice_node {

		prefix() {
			return 'node.test'
		}

		filter( file: $mol_file ) {
			if( !super.filter( file ) ) return false
			// if( /\.test\./.test( file.name() ) ) return false
			return true
		}

		bundle_classes() {
			return [
				this.$.$mam_bundle_test_js,
				this.$.$mam_bundle_test_html,
				this.$.$mam_bundle_audit_js,
				this.$.$mam_bundle_dts,
			]
		}

	}

}
