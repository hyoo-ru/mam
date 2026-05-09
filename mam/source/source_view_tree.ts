namespace $ {

	export class $mam_source_view_tree extends $mam_source {

		static match( file: $mol_file ): boolean {
			return /\.view\.tree$/.test( file.name() )
		}

		@ $mol_mem
		deps() {
			const deps = super.deps()
			deps.set( this.lookup( 'mol/type/enforce' ), 0 )
			return deps
		}

	}

}
