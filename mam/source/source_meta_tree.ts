namespace $ {

	export class $mam_source_meta_tree extends $mam_source {

		static match( file: $mol_file ): boolean {
			return file.ext() == 'meta.tree'
			// /\.meta\.tree$/.test( 
		}

		@ $mol_mem_key
		deps( source : $mol_file ) {
			
			const deps = super.deps( source )
			if( source.ext() !== 'meta.tree' ) return deps

			const tree = this.tree( source )
			const root_dir = this.root().dir()
		
			tree.select( 'require' ).sub.forEach( leaf => {
				deps.set( root_dir.resolve( leaf.value ), 0 )
			} )
			
			tree.select( 'include' ).sub.forEach( leaf => {
				deps.set( root_dir.resolve( leaf.value ), -9000 )
			} )

			return deps
		}

		@ $mol_mem_key
		tree( source : $mol_file ) {
			return $mol_tree.fromString( source.text() , source.path() )
		}

	}

}
