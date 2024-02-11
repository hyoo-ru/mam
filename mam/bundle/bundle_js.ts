namespace $ {

	export class $mam_bundle_js extends $mam_bundle {

		@ $mol_mem_key
		generated( slice: $mam_slice ) {
			const start = Date.now()

			const prefix = slice.prefix()
			const output = slice.pack().output()
			const script = output.resolve( `${prefix}.js` ) 
			const map = output.resolve( `${prefix}.js.map` ) 

			const concater = new this.$.$mol_sourcemap_builder( script.name(), ';' )
			concater.add( '#!/usr/bin/env node\n"use strict"' )

			if( /node/.test( prefix ) ) {
				concater.add( 'var exports = void 0' )
			} else {
				concater.add( 'function require'+'( path ){ return $node[ path ] }' )
			}

			const files = [ ...slice.files() ].filter( file => /\.[j]sx?$/.test( file.name() ) )

			for( const file of files ) {
				const file_map = file.parent().resolve( file.name() + '.map' )
				const content = file.text().replace( /^\/\/#\ssourceMappingURL=.*$/mg, '' )
				
				const isCommonJs = /typeof +exports|module\.exports|\bexports\.\w+\s*=/.test( content )
					
				if( isCommonJs ) {
					concater.add( `\nvar $node = $node || {}\nvoid function( module ) { var exports = module.${''}exports = this; function require( id ) { return $node[ id.replace( /^.\\//, "` + file.parent().relate( this.root().dir().resolve( 'node_modules' ) ) + `/" ) ] }; \n`, '-' )
				}

				concater.add( content, file.relate( output ), file_map.text() || undefined )
				
				if( isCommonJs ) {
					const idFull = file.relate( this.root().dir().resolve( 'node_modules' ) )
					const idShort = idFull.replace( /\/index\.js$/, '' ).replace( /\.js$/, '' )
					concater.add( `\n$${''}node[ "${ idShort }" ] = $${''}node[ "${ idFull }" ] = module.${''}exports }.call( {}, {} )\n`, '-' )
				}
			}

			const text = concater.content + `\n//# sourceMappingURL=${ map.relate( output ) }\n`
			script.text( text )
			map.text( JSON.stringify( concater.sourcemap ) )
			
			this.log( script, Date.now() - start )
			
			return [ script, map ]
		}

	}

}
