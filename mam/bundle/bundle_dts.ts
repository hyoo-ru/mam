namespace $ {

	export class $mam_bundle_dts extends $mam_bundle {

		@ $mol_mem_key
		slice_artifacts( slice: $mam_slice ) {
			const start = Date.now()

			const prefix = slice.prefix().replace( /\.test$/, '' )
			const output = slice.pack().output()

			const target = output.resolve( `${ prefix }.d.ts` )
			const target_map = output.resolve( `${ prefix }.d.ts.map` )

			const sources = [ ... slice.files() ].filter( file => {
				if( !/\.d\.ts$/.test( file.name() ) ) return false
				if( /\.test\./.test( file.name() ) ) return false
				return file.exists()
			} )
			if( sources.length === 0 ) return []

			const concater = new $mol_sourcemap_builder( output.path() )

			for( const src of sources ) {
				if( !src.text() ) continue
				concater.add( src.text(), src.relate( output ) )
			}

			target.text( concater.content + '\nexport = $;\n//# sourceMappingURL=' + target_map.relate( output ) + '\n' )
			target_map.text( concater.toString() )

			this.log( target, Date.now() - start )

			return [ target, target_map ]
		}

	}

}
