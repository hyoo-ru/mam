namespace $ {

	type ts_Node = import('typescript').Node

	export class $mam_source_ts extends $mam_source {

		@ $mol_mem_key
		deps( file : $mol_file ) {
			
			if( !/tsx?$/.test( file.ext() ) ) return super.deps( file )

			const deps = this.ts_source_deps( file ).mam_deps

			let name_parts = file.name().split('.')

			while( name_parts.length > 2 ) {

				name_parts.splice( -2, 1 )

				const dep = file.parent().resolve( name_parts.slice( 0, -1 ).join( '.' ) + '.ts' )
				if( dep.exists() ) deps.set( dep , 0 )

			}

			return deps
		}

		@ $mol_mem_key
		ts_source( source : $mol_file ) {
			const target = this.root().ts_options().target!
			return $node.typescript.createSourceFile( source.path() , source.text() , target )
		}

		@ $mol_mem_key
		ts_source_deps( file : $mol_file ) {
			const mam_deps = new Map< $mol_file , number >()
			const node_deps: Set< string > = new Set

			if( !/tsx?$/.test( file.ext() ) ) return { mam_deps, node_deps }

			const ts_source = this.ts_source( file )

			const visit = ( node: ts_Node, parent: ts_Node , priority: number ) => {
				if( !$node.typescript.isIdentifier( node ) ) {
					node.forEachChild( child => visit( child, node, priority - 1 ) )
					return
				}
				
				const text = node.escapedText as string
				const fqn = text.match( /\$([^$]*)/ )?.[1]
				if( !fqn ) return

				if( fqn == 'node' ) {

					if( $node.typescript.isPropertyAccessExpression( parent ) ) {
						node_deps.add( parent.name.escapedText as string )
					}

					else if ($node.typescript.isElementAccessExpression( parent ) 
						&& $node.typescript.isStringLiteral( parent.argumentExpression ) ) {
						node_deps.add( parent.argumentExpression.text )
					}

				}
				
				const path = fqn.replace( /[._]/g , '/' )
				mam_deps.set( this.lookup( path ) , priority )
			}

			ts_source.forEachChild( child => visit( child, ts_source, 0 ) )

			return { mam_deps, node_deps }
		}

	}

}
