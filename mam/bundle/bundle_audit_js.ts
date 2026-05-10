namespace $ {

	export class $mam_bundle_audit_js extends $mam_bundle {

		@ $mol_mem_key
		generated( slice: $mam_slice ) {
			const start = Date.now()
			
			const prefix = slice.prefix()
			
			const output = slice.pack().output()
			const target = output.resolve( `${prefix}.audit.js` )

			const changes = this.checker( slice )?.recheck()
			if( changes ) this.checker_changes_apply( changes )
			
			const errors = [] as Error[]

			const paths = this.ts_paths( slice )

			for( const path of paths ) {

				if( /\.d\.ts/.test( path ) ) continue
				this.root().convert([ this.$.$mam_convert_ts, $mol_file.absolute( path ) ])?.transpile_out()
				// this.js_content( path ) // recheck on file change

				const error = this.on_error( path )
				if( !error ) continue
				
				errors.push( new Error( error ) )
				this.on_error( path, null ) // ts will refill it on change
			}
			
			this.log( target, Date.now() - start )
			
			if( errors.length ) {
				$mol_fail_hidden( new $mol_error_mix( `Build fail ${ slice.pack().dir().relate( slice.root().dir() ) }`, ... errors ) )
			}

			target.text( `console.info( '%c ▫ $mam ▫ Audit passed', 'color:forestgreen; font-weight:bolder' )` )
			
			return [ target ]
		}

		@ $mol_mem_key
		checker( slice: $mam_slice ) {
			const paths = this.ts_paths( slice )
			if( !paths.length ) return null

			const checker = new this.$.$mam_checker
			checker.paths = () => paths
			checker.root_path = () => this.root().dir().path()
			checker.options = () => this.root().ts_options()
			return checker
		}

		checker_changes_apply( changes: $mam_checker_changes ) {
			for( const [ path, data ] of changes.writes ) {
				this.$.$mol_file.relative( path ).text( data, 'virt' )
			}
			for( const [ path, error ] of changes.errors ) {
				this.on_error( path, error )
			}
		}

		@ $mol_mem_key
		ts_paths( slice: $mam_slice ) {

			const sources = [ ...slice.files() ].filter( src => /tsx?$/.test( src.ext() ) )

			if( /node/.test( slice.prefix() ) ) {
				const lines = [] as string[]
				
				for( let dep of ( slice as $mam_slice_node ).node_deps() ) {
					lines.push( '\t' + JSON.stringify( dep ) + ': typeof import\( ' + JSON.stringify( dep ) + ' )' )
				}
				
				if( lines.length > 0 ) {
				
					const node_types = slice.pack().dir().resolve( `-node/deps.d.ts` )
					node_types.text( 'interface $node {\n ' + lines.join( '\n' ) + '\n}' )
					sources.push( node_types )

				}
			}

			return sources.map( src => src.path() )
		}

		@ $mol_mem_key
		on_error( path: string, next = null as null | string ) {
			if( /\.d\.ts$/.test( path ) ) return next
			this.root().convert([ this.$.$mam_convert_ts, $mol_file.absolute( path ) ])?.transpile_out()
			return next
		}

	}

}
