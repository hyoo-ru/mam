namespace $ {

	export class $mam_source_dir extends $mam_source {

		match( file : $mol_file ) {
			return file.type() === 'dir'
		}

		@ $mol_mem_key
		deps( source : $mol_file ) {
			
			if( !source.exists() ) return super.deps( source )
			if( source.type() !== 'dir' ) return super.deps( source )
			
			const deps = new Map< $mol_file , number >()

			for( const item of source.sub() ) {
				if( item.type() !== 'file' ) continue
				deps.set( item , 0 )
			}
			
			return deps
		}

	}

}
