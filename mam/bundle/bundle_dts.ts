namespace $ {

	export class $mam_bundle_dts extends $mam_bundle {

		@ $mol_mem_key
		generated( slice: $mam_slice ) {
			const start = Date.now()

			// const script = this.pack().output().resolve( `${prefix}.d.ts` )
			// const map = this.pack().output().resolve( `${prefix}.d.ts.map` )

			const prefix = slice.prefix()

			const target = slice.pack().output().resolve( `${ prefix }.d.ts` )
			
			const sources = [ ... slice.files() ].filter( file => /\.d\.ts$/.test( file.name() ) )
			if( sources.length === 0 ) return []
			
			const concater = new $mol_sourcemap_builder( target.parent().path() )
			
			sources.forEach(
				function( src ) {
					if( ! src.exists() || ! src.text() ) return
					concater.add( src.text(), src.relate( target.parent() ) )
				}
			)
			
			target.text( concater.content + '\nexport = $;' )
			
			this.log( target, Date.now() - start )
			
			return [ target ]
			// return [ script, map ]
		}

	}
	
}
