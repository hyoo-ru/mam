namespace $ {

	export class $mam_source_view_ts extends $mam_source {

		static match( file: $mol_file ): boolean {
			return /\.view\.ts$/.test( file.name() )
		}
		
		@ $mol_mem
		deps() {
			const deps = super.deps()
			
			const file = this.file()
			
			const tree = this.$.$mol_file.absolute( file.path().replace( /\.ts$/ , '\.tree' ) )
			deps.set( tree, 0 )

			return deps
		}

	}

}
