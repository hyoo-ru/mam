namespace $ {

	export class $mam_source_dir extends $mam_source {

		static match( file: $mol_file ): boolean {
			return file.type() == 'dir'
		}

		@ $mol_mem
		deps() {
			
			const dir = this.file()
			const deps = super.deps()

			for( const item of dir.sub() ) {
				if( item.type() !== 'file' ) continue
				deps.set( item , 0 )
			}

			if( dir !== this.root().dir() ) deps.set( dir.parent() , Number.MIN_SAFE_INTEGER )
			
			return deps
		}

	}

}
