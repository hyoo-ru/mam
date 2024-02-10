namespace $ {

	export class $mam_bundle_audit_js extends $mam_bundle {

		@ $mol_mem_key
		generated( slice: $mam_slice ) {
			
			const prefix = slice.prefix()
			
			const start = Date.now()
			
			const output = slice.pack().output()
			const target = output.resolve( `${prefix}.audit.js` )

			this.ts_service( slice )?.recheck()
			
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
			
			this.log( target , Date.now() - start )
			
			if( errors.length ) {
				$mol_fail_hidden( new $mol_error_mix( `Build fail ${ slice.pack().dir().relate( slice.root().dir() ) }`, ... errors ) )
			}

			target.text( `console.info( '%c ▫ $mol_build ▫ Audit passed', 'color:forestgreen; font-weight:bolder' )` )
			
			return [ target ]
		}

		@ $mol_mem_key
		ts_paths( slice: $mam_slice ) {

			const sources = [ ...slice.files() ].filter( src => /tsx?$/.test( src.ext() ) )

			if( /node/.test( slice.prefix() ) ) {
				const types = [] as string[]
				
				for( let dep of ( slice as $mam_slice_node ).node_deps() ) {
					types.push( '\t' + JSON.stringify( dep ) + ' : typeof import\( ' + JSON.stringify( dep ) + ' )' )
				}
				
				if( types.length > 0 ) {
				
					const node_types = slice.pack().dir().resolve( `-node/deps.d.ts` )
					node_types.text( 'interface $node {\n ' + types.join( '\n' ) + '\n}' )
					sources.push( node_types )

				}
			}

			return sources.map( src => src.path() )
		}

		@ $mol_mem_key
		ts_service( slice: $mam_slice ) {

			const paths = this.ts_paths( slice )
			if( !paths.length ) return null

			const watchers = new Map< string , ( path : string , kind : number )=> void >()
			let run = ()=> {}
			
			var host = $node.typescript.createWatchCompilerHost(

				paths ,
				
				{
					... this.root().ts_options(),
					emitDeclarationOnly : true,
				},
				
				{
					... $node.typescript.sys ,
					watchDirectory: ( path, cb ) => {
						// console.log('watchDirectory', path )
						watchers.set( path , cb )
						return { close(){} }
					},
					writeFile : ( path , data )=> {
						$mol_file.relative( path ).text( data, 'virt' )
					},
					setTimeout : ( cb : any )=> {
						// console.log('setTimeout' )
						run = cb
					} ,
					watchFile : ( path:string, cb:(path:string,kind:number)=>any )=> {
						// console.log('watchFile', path )
						watchers.set( path , cb )
						return { close(){ } }
					},
				},
				
				$node.typescript.createSemanticDiagnosticsBuilderProgram,

				( diagnostic )=> {

					if( diagnostic.file ) {

						const error = $node.typescript.formatDiagnostic( diagnostic , {
							getCurrentDirectory : ()=> this.root().dir().path() ,
							getCanonicalFileName : ( path : string )=> path.toLowerCase() ,
							getNewLine : ()=> '\n' ,
						})
						// console.log('XXX', error )
						this.on_error( diagnostic.file.getSourceFile().fileName , error )
						
					} else {
						this.$.$mol_log3_fail({
							place : `${this}.tsService()` ,
							message: String( diagnostic.messageText ) ,
						})
					}
					
				} ,

				()=> {}, //watch reports
				
				[], // project refs
				
				{ // watch options
					synchronousWatchDirectory: true,
					watchFile: 5,
					watchDirectory: 0,
				},
				
			)

			const service = $node.typescript.createWatchProgram( host )

			const versions = {} as Record< string , number >

			return {
				recheck: ()=> {
					for( const path of paths ) {
						const version = $node.fs.statSync( path ).mtime.valueOf()
						// this.js_error( path, null )
						if( versions[ path ] && versions[ path ] !== version ) {
							const watcher = watchers.get( path )
							if( watcher ) watcher( path , 2 )
						}
						versions[ path ] = version
					}
					run()
				},
				destructor : ()=> service.close()
			}

		}

		@ $mol_mem_key
		on_error( path : string , next = null as null | string ) {
			this.root().convert([ this.$.$mam_convert_ts, $mol_file.absolute( path ) ])?.transpile_out()
			return next
		}

	}

}
