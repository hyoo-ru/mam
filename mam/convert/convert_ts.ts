namespace $ {

	export class $mam_convert_ts extends $mam_convert {

		@ $mol_mem_key
		generated( source : $mol_file ) {
			if( !/tsx?$/.test( source.ext() ) ) return []

			return [
				this.js( source ),
				this.map( source ),
			]
		}

		@ $mol_mem_key
		js( file : $mol_file ) {
			const res = this.transpile_out( file )
			const js = file.parent().resolve( file.name() + '.js' )
			const text = res.outputText.replace( /^\/\/#\ssourceMappingURL=[^\n]*/mg , '//' + file.relate() ) + '\n'
			js.text( text, 'virt' )
			return js
		}

		@ $mol_mem_key
		map( file : $mol_file ) {
			const res = this.transpile_out( file )
			const map = file.parent().resolve( file.name() + '.js.map' )
			map.text( res.sourceMapText ?? '', 'virt' )
			return map
		}

		@ $mol_mem_key
		transpile_out( file : $mol_file ) {

			console.time(file.path())

			const res = $node.typescript.transpileModule( file.text() , {
				compilerOptions: this.root().ts().options(),
				fileName: file.path(),
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
			console.timeEnd(file.path())

			return res
		}
		
	}

}
