namespace $ {

	export class $mam_bundle_audit_js extends $mam_bundle {

		@ $mol_mem_key
		slice_artifacts( slice: $mam_slice ) {
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
				$mol_fail_hidden( new $mol_error_mix( `Build fail ${ slice.pack().dir().relate( slice.root().dir() ) }`, {}, ... errors ) )
			}

			target.text( `console.info( '%c ▫ $mam ▫ Audit passed', 'color:forestgreen; font-weight:bolder' )` )
			
			return [ target ]
		}

		@ $mol_mem_key
		checker( slice: $mam_slice ) {
			return this.checker_rpc( slice )?.remote() ?? null
		}

		@ $mol_mem_key
		checker_rpc( slice: $mam_slice ) {
			const paths = this.ts_paths( slice )
			if( !paths.length ) return null

			const handlers: $mam_checker_remote = {
				changes: changes => this.checker_changes_apply( changes ),
				status: ()=> {},
			}

			const workerData: $mam_checker_worker_data = {
				paths,
				root: this.root().dir().path(),
				options: this.root().ts_options(),
			}

			return this.$.$mol_rpc_worker.make< typeof $mol_rpc_worker< $mam_checker_shared > >({
				options: $mol_const({
					resourceLimits: {
						maxOldGenerationSizeMb: this.checker_max_mem(),
					},
					workerData,
				}),
				uri: () => __filename,
				handlers: () => handlers,
			})
		}

		checker_max_mem() {
			return Number( this.$.$mol_env().MAM_CHECKER_MAX_MEM || this.$.$mol_env().MOL_BUILD_CHECKER_MAX_MEM || '2560' )
		}

		@ $mol_action
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
