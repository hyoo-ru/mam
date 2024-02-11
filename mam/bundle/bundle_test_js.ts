namespace $ {

	export class $mam_bundle_test_js extends $mam_bundle {

		@ $mol_mem_key
		generated( slice: $mam_slice ) {
			const start = Date.now()

			const prefix = slice.prefix()
			const pack = slice.pack()
			const pack_dir = slice.pack().dir()
			
			const root_dir = this.root().dir()
			const target = pack.output().resolve( `${prefix}.test.js` )
			const targetMap = pack.output().resolve( `${prefix}.test.js.map` )
			
			const concater = new $mol_sourcemap_builder( root_dir.relate( target.parent() ), ';')
			concater.add( '"use strict"' )
			
			// const exclude_ext = exclude.filter( ex => ex !== 'test' && ex !== 'dev' )

			const sources = [ ...slice.files() ].filter( file => /\.[jt]sx?$/.test( file.name() ) )
			// this.sources_js( { path, exclude: exclude_ext } )

			// const sourcesNoTest = new Set( this.sources_js( { path, exclude } ) )
			// const sourcesTest = sources.filter( src => !sourcesNoTest.has( src ) )
			// if( prefix === 'node' ) {
			// 	sourcesTest = [ ... sourcesNoTest, ... sourcesTest ]
			// } else {
			if( prefix !== 'node' ) {
				concater.add( 'function require'+'( path ){ return $node[ path ] }' )
			}

			if( sources.length === 0 ) return []
			
			const errors = [] as Error[]

			// sourcesTest.forEach(
			sources.forEach(
				( src )=> {
					if( prefix === 'node' ) {
						if( /node_modules\//.test( src.relate( root_dir ) ) ) {
							return
						}
					}
					try {
						// const content = this.js_content( src.path() )
						const js = src.text()
						const map = src.parent().resolve( src.name().replace( /\.js$/, 'map' ) ).text()
						concater.add( js, '', map )
						// concater.add( content.text, '', content.map)
					} catch( error: any ) {
						errors.push( error )
					}
				}
			)
			
			target.text( concater.content + '\n//# sourceMappingURL=' + targetMap.relate( target.parent() )+'\n' )
			targetMap.text( concater.toString() )
			
			this.log( target, Date.now() - start )
			
			if( errors.length ) $mol_fail_hidden( new $mol_error_mix( `Build fail ${ pack_dir.path() }`, ...errors ) )

			if( prefix === 'node' ) {
				this.$.$mol_exec( root_dir.path(), 'node', '--enable-source-maps', '--trace-uncaught', target.relate( root_dir ) )
			}
			
			return [ target, targetMap ]
		}

	}

}
