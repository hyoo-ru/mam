namespace $ {

	export class $mam_source_dir extends $mam_source {

		@ $mol_mem_key
		deps( source : $mol_file ) {
			
			const deps = super.deps( source )
			if( source.type() !== 'dir' ) return deps

			for( const item of source.sub() ) {
				if( item.type() !== 'file' ) continue
				deps.set( item , 0 )
			}

			if( source !== this.root().dir() ) deps.set( source.parent() , Number.MIN_SAFE_INTEGER )
			
			return deps
		}

	}

}
