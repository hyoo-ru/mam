namespace $ {

	export class $mam_source_ts extends $mam_source {

		@ $mol_mem_key
		ts_source( source : $mol_file ) {
			const target = this.root().ts().options().target!
			return $node.typescript.createSourceFile( source.path() , source.text() , target )
		}

		/** @todo Use `ts_source` to search references throught AST */
		@ $mol_mem_key
		deps( file : $mol_file ) {
			
			const deps = super.deps( file )
			if( !/tsx?$/.test( file.ext() ) ) return deps

			for( const code of file.text().matchAll( $mam_source_remarks_js ) ) {
				if( code.groups ) continue

				for( const line of code[0].split( '\n' ) ) {

					const refs = line.matchAll( $mam_source_refs_js )

					const indent = line.matchAll( $mam_source_line )?.next().value?.groups?.indent ?? ''
					const priority = - indent.replace( /\t/g , '    ' ).length / 4

					for( const { groups } of refs ) {

						if( groups?.fqn ) {
							const dep = this.root().dir().resolve( groups.name.replace( /[._]/g , '/' ) )
							deps.set( this.lookup( dep ) , priority )
						}
						
						if( groups?.req ) {
							const dep = file.parent().resolve( groups.path )
							deps.set( dep , priority )
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
			// const js = file.parent().resolve( file.name() + '.js' )
			// js.text_cached( res.outputText )
			// deps.set( js , 0 )

			// const map = file.parent().resolve( file.name() + '.js.map' )
			// map.text_cached( res.sourceMapText ?? '' )
			// deps.set( map , 0 )

			return deps
		}

	}

}
