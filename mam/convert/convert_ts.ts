namespace $ {

	export class $mam_convert_ts extends $mam_convert {

		static match( file: $mol_file ): boolean {
			return /tsx?$/.test( file.ext() )
		}

		@ $mol_mem
		generated() {
			return [
				this.js(),
				this.map(),
			]
		}

		@ $mol_mem
		js() {
			const source = this.source()
			const res = this.transpile_out()

			const js = source.parent().resolve( source.name() + '.js' )

			const text = res.outputText.replace( /^\/\/#\ssourceMappingURL=[^\n]*/mg , '//' + source.relate() ) + '\n'

			js.text( text, 'virt' )
			return js
		}

		@ $mol_mem
		map() {
			const source = this.source()
			const res = this.transpile_out()
			const map = source.parent().resolve( source.name() + '.js.map' )
			map.text( res.sourceMapText ?? '', 'virt' )
			return map
		}

		@ $mol_mem
		transpile_out() {
			const source = this.source()

			console.time(source.path())

			const res = $node.typescript.transpileModule( source.text() , {
				compilerOptions: this.root().ts_options(),
				fileName: source.path(),
				reportDiagnostics: true,
			})

			if( res.diagnostics?.length ) {
				return $mol_fail( new Error(
					$node.typescript.formatDiagnosticsWithColorAndContext(
						res.diagnostics ,
						{
							getCanonicalFileName: ( path : string )=> path,
							getCurrentDirectory: $node.typescript.sys.getCurrentDirectory,
							getNewLine: () => $node.typescript.sys.newLine,
						}
					)
				) )
			}
			console.timeEnd(source.path())

			return res
		}
		
	}

}
