namespace $ {

	export class $mam_source_js extends $mam_source {

		@ $mol_mem_key
		deps( source : $mol_file ) {
			
			const deps = super.deps( source )
			if( !/\.js$/.test( source.ext() ) ) return deps
			// extract dependencies
			
			return deps
		}

	}

}
