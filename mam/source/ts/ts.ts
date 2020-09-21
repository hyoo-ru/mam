namespace $ {

	export class $mam_source_ts extends $mam_source {

		@ $mol_mem_key
		ts_source( source : $mol_file ) {
			const target = this.root().ts_options().target!
			return $node.typescript.createSourceFile( source.path() , source.text() , target )
		}

		/** @todo Use `ts_source` to search references throught AST */
		@ $mol_mem_key
		deps( file : $mol_file ) {
			
			const deps = super.deps( file )

			if( !/tsx?$/.test( file.ext() ) ) return deps
			if( !file.exists() ) return deps

			for( const code of $mam_source_ts_remarks.parse( file.text() ) ) {
				if( !code[0] ) continue

				for( const line of code[0].split( '\n' ) ) {
					const indent = $mam_source_line.parse( line ).next().value?.indent ?? ''
					
					for( const ref of $mam_source_ts_refs.parse( line ) ) {
						
						if( ref.fqn ) {
							const dep = this.root().dir().resolve( ref.name.replace( /[._]/g , '/' ) )
							deps.set( this.lookup( dep ) , - indent.length )
						}
						
						if( ref.req ) {
							const dep = file.parent().resolve( ref.path )
							deps.set( dep , - indent.length )
						}

					}

				}

			}
// console.time(file.path())
// 			const res = $node.typescript.transpileModule( file.text() , {
// 				compilerOptions: this.root().ts_options(),
// 				fileName: file.path(),
// 				reportDiagnostics: true,
// 			})

// 			if( res.diagnostics?.length ) {
// 				throw new Error(
// 					$node.typescript.formatDiagnosticsWithColorAndContext(
// 						res.diagnostics ,
// 						{
// 							getCanonicalFileName: ( path : string )=> path,
// 							getCurrentDirectory: $node.typescript.sys.getCurrentDirectory,
// 							getNewLine: () => $node.typescript.sys.newLine,
// 						}
// 					)
// 				)
// 			}
			
// 			console.timeEnd(file.path())
			const js = file.parent().resolve( file.name() + '.js' )
			// js.text_cached( res.outputText )
			deps.set( js , 0 )

			// const map = file.parent().resolve( file.name() + '.js.map' )
			// map.text_cached( res.sourceMapText ?? '' )
			// deps.set( map , 0 )

			return deps
		}

	}

}
