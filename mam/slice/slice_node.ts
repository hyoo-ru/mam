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
