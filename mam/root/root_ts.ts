namespace $ {

	const ts = $node.typescript as typeof import( "typescript" )

	/** MAM Root of all sources. */
	export class $mam_root_ts extends $mol_object2 {

		@ $mol_mem
		dir() {
			return this.$.$mol_file.relative( '.' )
		}

		@ $mol_mem
		config() {

			const path = this.dir().resolve( 'tsconfig.json' ).path()

			const config = ts.readConfigFile(
				path ,
				( path : string )=> this.$.$mol_file.absolute( path ).text()
			)

			if( config.error ) {
				throw new Error(
					ts.formatDiagnosticsWithColorAndContext(
						[ config.error ] ,
						{
							getCanonicalFileName: ( path : string )=> path,
							getCurrentDirectory: ts.sys.getCurrentDirectory,
							getNewLine: () => ts.sys.newLine,
						}
					)
				)
			}

			return config.config
		}

		@ $mol_mem
		options() {

			const options = ts.convertCompilerOptionsFromJson(
				this.config().compilerOptions ,
				"." ,
				'tsconfig.json'
			)

			if( options.errors.length ) {
				throw new Error(
					ts.formatDiagnosticsWithColorAndContext(
						options.errors ,
						{
							getCanonicalFileName: ( path : string )=> path,
							getCurrentDirectory: ts.sys.getCurrentDirectory,
							getNewLine: () => ts.sys.newLine,
						}
					)
				)
			}

			return options.options
		}

		@ $mol_mem
		registry() {
			return ts.createDocumentRegistry()
		}

		// ts_host() : Parameters< typeof ts.createLanguageService >[0] {
		@ $mol_mem
		host() {
			return {
				fileExists: ( path: string )=> $mol_file.relative( path ).exists(),
				readFile: ( path: string )=> $mol_file.relative( path ).text(),
				writeFile: ( path: string , text: string )=> $mol_file.relative( path ).text( text, 'virt' ),
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
					
				// 	return ts.ScriptSnapshot.fromString( file.text() )
				// },
				// // getProjectReferences?(): readonly ProjectReference[] | undefined;
				// // getLocalizedDiagnosticMessages?(): any;
				// // getCancellationToken?(): HostCancellationToken;
				// getCurrentDirectory: () => this.dir().path(),
				// getDefaultLibFileName: options => {
				// 	return ts.getDefaultLibFilePath( options )
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
			// type xxx = $mol_type_assert< {a:1},typeof ts.createLanguageService >
		}

		@ $mol_mem
		service() {
			return ts.createLanguageService(
				this.host() as any,
				this.registry()
			)
		}

		@ $mol_mem_key
		emit( file : $mol_file ) {
			const res = this.service().getEmitOutput( file.path() )
			return file.version()
		}

	}

}
