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

	}

}
