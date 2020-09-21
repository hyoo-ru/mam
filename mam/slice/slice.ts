namespace $ {

	/** Collects sources by dependencies. */
	export class $mam_slice extends $mol_object2 {

		@ $mol_mem
		pack() {
			return undefined as any as $mam_package
		}

		root() {
			return this.pack().root()
		}
		
		prefix() {
			return 'index'
		}

		filter( file : $mol_file ) {
			if( !/^[a-z0-9]/i.test( file.name() ) ) return false
			return true
		}

		@ $mol_mem
		graph() {
			
			const ignore = new Set<$mol_file>()
			const graph = new $mol_graph< $mol_file , { priority : number } >()
			const sources = this.pack().root().sources()
			
			const collect = ( file : $mol_file )=> {

				if( ignore.has( file ) ) return
				ignore.add( file )

				for( const source of sources ) {

					for( const[ dep , priority ] of source.deps( file ) ) {

						if( !this.filter( dep ) ) continue

						const edge = graph.edge_out( file , dep )
						if( !edge || edge.priority < priority ) {
							graph.link( file , dep , { priority } )
						}
						
						collect( dep )

					}
					
				}

			}

			collect( this.pack().dir() )
			
			graph.acyclic( edge => edge.priority )
			
			return graph
		}

		@ $mol_mem
		files() {
			return this.graph().sorted
		}

		@ $mol_mem_key
		bundle< Bundle extends typeof $mam_bundle >( Bundle : Bundle ) {
			const bundle = new Bundle
			bundle.slice = $mol_const( this )
			return bundle
		}

		@ $mol_mem
		bundles() {
			return [
				this.bundle( this.$.$mam_bundle_meta ) ,
				this.bundle( this.$.$mam_bundle_js ) ,
				this.bundle( this.$.$mam_bundle_dts ) ,
			]
		}

		@ $mol_mem
		ts_host() : Parameters< typeof $node.typescript.createLanguageService >[0] {
			return {
				getCompilationSettings: () => this.root().ts_options(),
				getNewLine: ()=> '\n',
				// getProjectVersion?(): string;
				getScriptFileNames: () => {
					return [ ... this.files() ].map( file => file.path() )
				},
				// getScriptKind?(fileName: string): ScriptKind;
				getScriptVersion: path => {
					return this.$.$mol_file.absolute( path ).version()
				},
				getScriptSnapshot: path => {

					const file = this.$.$mol_file.absolute( path )
				  	if( !file.exists() ) return undefined
					
					return $node.typescript.ScriptSnapshot.fromString( file.text() )
				},
				// getProjectReferences?(): readonly ProjectReference[] | undefined;
				// getLocalizedDiagnosticMessages?(): any;
				// getCancellationToken?(): HostCancellationToken;
				getCurrentDirectory: () => this.root().dir().path(),
				getDefaultLibFileName: options => {
					return $node.typescript.getDefaultLibFilePath( options )
				},
				// log?(s: string): void;
				// trace?(s: string): void;
				// error?(s: string): void;
				// useCaseSensitiveFileNames?(): boolean;
				readDirectory: (path : string)=> {
					const dir = this.$.$mol_file.absolute( path )
					return dir.sub().map( file => file.path() )
				},
				readFile: path => {
					return this.$.$mol_file.absolute( path ).text()
				},
				// realpath?(path: string): string;
				fileExists: path => {
					return this.$.$mol_file.absolute( path ).exists()
				},
				directoryExists: path => {
					return this.$.$mol_file.absolute( path ).exists()
				},
				// getTypeRootsVersion?(): number;
				// resolveModuleNames?(moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference: ResolvedProjectReference | undefined, options: CompilerOptions): (ResolvedModule | undefined)[];
				// getResolvedModuleWithFailedLookupLocationsFromCache?(modulename: string, containingFile: string): ResolvedModuleWithFailedLookupLocations | undefined;
				// resolveTypeReferenceDirectives?(typeDirectiveNames: string[], containingFile: string, redirectedReference: ResolvedProjectReference | undefined, options: CompilerOptions): (ResolvedTypeReferenceDirective | undefined)[];
				// getDirectories?(directoryName: string): string[];
				// getCustomTransformers?(): CustomTransformers | undefined;
				// isKnownTypesPackageName?(name: string): boolean;
				// installPackage?(options: InstallPackageOptions): Promise<ApplyCodeActionCommandResult>;
				writeFile: ( path, text )=> {
					console.log( 'W' , ' ' , path , ' ' , text.length )
					this.$.$mol_file.absolute( path ).text( text, $mol_mem_force_cache )
				},
			}
			type xxx = $mol_type_assert< {a:1},typeof $node.typescript.createLanguageService >
		}

		@ $mol_mem
		ts_service() {
			return $node.typescript.createLanguageService(
				this.ts_host(),
				this.root().ts_registry()
			)
		}

		@ $mol_mem_key
		ts_emit( file : $mol_file ) {
			const res = this.ts_service().getEmitOutput( file.path() )
			return file.version()
		}

	}

	export class $mam_slice_web extends $mam_slice {

		filter( file : $mol_file ) {
			if( !super.filter( file ) ) return false
			if( /\.node\./.test( file.name() ) ) return false
			return true
		}

		prefix() {
			return 'web'
		}

	}

	export class $mam_slice_web_prod extends $mam_slice_web {

		filter( file : $mol_file ) {
			if( !super.filter( file ) ) return false
			if( /\.test\./.test( file.name() ) ) return false
			return true
		}
		
	}

	export class $mam_slice_web_test extends $mam_slice_web {

		prefix() {
			return 'web.test'
		}

		@ $mol_mem
		files() {
			
			const all = super.files()
			const prod = this.pack().slice( this.$.$mam_slice_web_prod ).files()
			
			const test = new Set< $mol_file >()

			for( const file of all ) {
				if( prod.has( file ) ) continue
				test.add( file )
			}

			return test
		}

	}

	export class $mam_slice_node extends $mam_slice {

		filter( file : $mol_file ) {
			if( !super.filter( file ) ) return false
			if( /\.web\./.test( file.name() ) ) return false
			return true
		}

		prefix() {
			return 'node'
		}

	}

	export class $mam_slice_node_prod extends $mam_slice_node {

		filter( file : $mol_file ) {
			if( !super.filter( file ) ) return false
			if( /\.test\./.test( file.name() ) ) return false
			return true
		}
		
	}

	export class $mam_slice_node_test extends $mam_slice_node {

		prefix() {
			return 'node.test'
		}

	}

}
