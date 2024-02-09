namespace $ {

	export class $mam_bundle_js extends $mam_bundle {

		@ $mol_mem_key
		generated( slice: $mam_slice ) {

			const prefix = slice.prefix()
			const output = slice.pack().output()
			const script = output.resolve( `${prefix}.js` ) 
			const map = output.resolve( `${prefix}.js.map` ) 

			const concater = new this.$.$mol_sourcemap_builder( script.name() )
			concater.add( '#!/usr/bin/env node\n"use strict"' )

			if( prefix === 'node' ) {
				concater.add( 'var exports = void 0' )
			} else {
				concater.add( 'function require'+'( path ){ return $node[ path ] }' )
			}

			const files = [ ...slice.files() ].filter( file => /\.[j]sx?$/.test( file.name() ) )

			console.log(files.map(String))

			for( const file of files ) {
				const file_map = file.parent().resolve( file.name() + '.map' )
				const content = file.text().replace( /^\/\/#\ssourceMappingURL=.*$/mg , '' )
				
				concater.add( `;//${ file.relate() }\n` )
				concater.add( content , file.relate( output ) , file_map.text() || undefined )
			}

			const text = concater.content + `\n//# sourceMappingURL=${ map.relate( output ) }\n`
			script.text( text )
			map.text( JSON.stringify( concater.sourcemap ) )
			
			this.$.$mol_log3_done({
				place : `$mam_bundle_js.generated()` ,
				message : 'Built',
				size : text.length,
				file : script.relate(),
				sourcemap : map.relate(),
				sources : [ ... files ].map(s=>s.relate()),
			})
			
			return [ script , map ]
		}

	}

}
