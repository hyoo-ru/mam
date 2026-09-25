namespace $ {

	export class $mam_bundle_baza extends $mam_bundle {

		@ $mol_mem_key
		slice_artifacts( slice: $mam_slice ) {
			const start = Date.now()

			const target = slice.pack().output().resolve( `${ slice.prefix() }.baza` )
			const sources = [ ... slice.files() ].filter( file => /baza$/.test( file.ext() ) )
			if( sources.length === 0 ) return []

			target.buffer( new Uint8Array( sources.flatMap( file => [ ... file.buffer() ] ) ) )

			this.log( target, Date.now() - start )
			return [ target ]
		}

	}

}
