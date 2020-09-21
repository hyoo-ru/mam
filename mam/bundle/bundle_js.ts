namespace $ {

	/** Makes JavaScript bundles. */
	export class $mam_bundle_js extends $mam_bundle {

		@ $mol_mem
		files() {
			return super.files().filter( file => /\.[jt]sx?$/.test( file.name() ) )
		}

		@ $mol_mem
		generated() {

			const slice = this.slice()
			const prefix = this.prefix()
			const output = this.pack().output()
			const script = output.resolve( `${prefix}.js` ) 
			const map = output.resolve( `${prefix}.js.map` ) 

			const concater = new $mol_sourcemap_builder( script.name() )

			console.log(this.files().map(String))

			for( var file of this.files() ) {
				if( file.ext() === 'ts' ) {
					slice.ts_emit( file )
				}
			}

			for( var file of this.files() ) {
				
				const file_map = file.parent().resolve( file.name() + '.map' )
				const content = file.text().replace( /^\/\/#\ssourceMappingURL=.*$/mg , '' )
				
				concater.add( `;//${ file.relate() }\n` )
				concater.add( content , file.relate( output ) , file_map.text() )

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
				sources : [ ... this.files() ].map(s=>s.relate()),
			})
			
			return [ script , map ]
		}

	}

}
