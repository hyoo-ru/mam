namespace $ {

	export class $mam_source_js extends $mam_source {

		@ $mol_mem_key
		deps( source : $mol_file ) {
			
			if( !/\.js$/.test( source.ext() ) ) return super.deps( source )
			
			const deps = new Map< $mol_file , number >()
			// extract dependencies
			
			return deps
		}

	}

}
