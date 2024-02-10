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
		
	}

	export class $mam_slice_node_test extends $mam_slice_node {

		prefix() {
			return 'node.test'
		}

	}

}
