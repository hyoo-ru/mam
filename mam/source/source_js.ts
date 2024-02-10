namespace $ {

	export class $mam_source_js extends $mam_source {

		static match( file: $mol_file ): boolean {
			return /\.js$/.test( file.name() )
		}

		@ $mol_mem
		deps() {
			
			const file = this.file()
			
			const deps =  super.deps()
			// extract dependencies
			
			return deps
		}

	}

}
