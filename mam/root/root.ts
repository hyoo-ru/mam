namespace $ {

	/** MAM Root of all sources. */
	export class $mam_root extends $mol_object2 {

		@ $mol_mem
		dir() {
			return this.$.$mol_file.relative( '.' )
		}

		@ $mol_mem_key
		pack( dir : $mol_file ) {
			
			const pack = new this.$.$mam_package
			
			pack.root = $mol_const( this )
			pack.dir = $mol_const( dir )
			
			return pack
		}

		@ $mol_mem_key
		source( Source : typeof $mam_source ) {
			return Source.create(
				source => source.root = $mol_const( this )
			)
		}

		@ $mol_mem
		sources() {
			return [
				this.source( this.$.$mam_source_dir ) ,
				this.source( this.$.$mam_source_js ) ,
				this.source( this.$.$mam_source_ts ) ,
			]
		}

		@ $mol_mem_key
		convert( Convert : typeof $mam_convert ) {
			return Convert.create(
				convert => convert.root = $mol_const( this )
			)
		}

		@ $mol_mem
		converts() {
			return [
				this.convert( this.$.$mam_convert_ts ) ,
			]
		}

		@ $mol_mem
		ts_config() {

			const path = this.dir().resolve( 'tsconfig.json' ).path()

			const config = $node.typescript.readConfigFile(
				path ,
				( path : string )=> this.$.$mol_file.absolute( path ).text()
			)

			if( config.error ) {
				throw new Error(
					$node.typescript.formatDiagnosticsWithColorAndContext(
						[ config.error ] ,
						{
							getCanonicalFileName: ( path : string )=> path,
							getCurrentDirectory: $node.typescript.sys.getCurrentDirectory,
							getNewLine: () => $node.typescript.sys.newLine,
						}
					)
				)
			}

			return config.config
		}

		@ $mol_mem
		ts_options() {

			const options = $node.typescript.convertCompilerOptionsFromJson(
				this.ts_config().compilerOptions ,
				"." ,
				'tsconfig.json'
			)

			if( options.errors.length ) {
				throw new Error(
					$node.typescript.formatDiagnosticsWithColorAndContext(
						options.errors ,
						{
							getCanonicalFileName: ( path : string )=> path,
							getCurrentDirectory: $node.typescript.sys.getCurrentDirectory,
							getNewLine: () => $node.typescript.sys.newLine,
						}
					)
				)
			}

			return options.options
		}

		@ $mol_mem
		ts_registry() {
			return $node.typescript.createDocumentRegistry()
		}

		@ $mol_mem
		ts_host() : Parameters< typeof $node.typescript.createLanguageService >[0] {
			return {
				// getCompilationSettings: () => this.ts_options(),
				// getNewLine: ()=> '\n',
				// // getProjectVersion?(): string;
				// getScriptFileNames: () => {
				// 	return [ ... this.files() ].map( file => file.path() )
				// },
				// // getScriptKind?(fileName: string): ScriptKind;
				// getScriptVersion: path => {
				// 	return this.$.$mol_file.absolute( path ).version()
				// },
				// getScriptSnapshot: path => {

				// 	const file = this.$.$mol_file.absolute( path )
				//   	if( !file.exists() ) return undefined
					
				// 	return $node.typescript.ScriptSnapshot.fromString( file.text() )
				// },
				// // getProjectReferences?(): readonly ProjectReference[] | undefined;
				// // getLocalizedDiagnosticMessages?(): any;
				// // getCancellationToken?(): HostCancellationToken;
				// getCurrentDirectory: () => this.dir().path(),
				// getDefaultLibFileName: options => {
				// 	return $node.typescript.getDefaultLibFilePath( options )
				// },
				// // log?(s: string): void;
				// // trace?(s: string): void;
				// // error?(s: string): void;
				// // useCaseSensitiveFileNames?(): boolean;
				// readDirectory: (path : string)=> {
				// 	const dir = this.$.$mol_file.absolute( path )
				// 	return dir.sub().map( file => file.path() )
				// },
				// readFile: path => {
				// 	return this.$.$mol_file.absolute( path ).text()
				// },
				// // realpath?(path: string): string;
				// fileExists: path => {
				// 	return this.$.$mol_file.absolute( path ).exists()
				// },
				// directoryExists: path => {
				// 	return this.$.$mol_file.absolute( path ).exists()
				// },
				// // getTypeRootsVersion?(): number;
				// // resolveModuleNames?(moduleNames: string[], containingFile: string, reusedNames: string[] | undefined, redirectedReference: ResolvedProjectReference | undefined, options: CompilerOptions): (ResolvedModule | undefined)[];
				// // getResolvedModuleWithFailedLookupLocationsFromCache?(modulename: string, containingFile: string): ResolvedModuleWithFailedLookupLocations | undefined;
				// // resolveTypeReferenceDirectives?(typeDirectiveNames: string[], containingFile: string, redirectedReference: ResolvedProjectReference | undefined, options: CompilerOptions): (ResolvedTypeReferenceDirective | undefined)[];
				// // getDirectories?(directoryName: string): string[];
				// // getCustomTransformers?(): CustomTransformers | undefined;
				// // isKnownTypesPackageName?(name: string): boolean;
				// // installPackage?(options: InstallPackageOptions): Promise<ApplyCodeActionCommandResult>;
				// writeFile: ( path, text )=> {
				// 	console.log( 'W' , ' ' , path , ' ' , text.length )
				// 	this.$.$mol_file.absolute( path ).text( text, $mol_mem_force_cache )
				// },
			}
			type xxx = $mol_type_assert< {a:1},typeof $node.typescript.createLanguageService >
		}

		@ $mol_mem
		ts_service() {
			return $node.typescript.createLanguageService(
				this.ts_host(),
				this.ts_registry()
			)
		}

		@ $mol_mem_key
		ts_emit( file : $mol_file ) {
			const res = this.ts_service().getEmitOutput( file.path() )
			return file.version()
		}

	}

}
