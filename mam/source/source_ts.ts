namespace $ {

	type ts_Node = import('typescript').Node

	export class $mam_source_ts extends $mam_source {

		static match( file: $mol_file ): boolean {
			return /tsx?$/.test( file.ext() )
		}
		
		@ $mol_mem
		deps() {
			const deps = this.ts_source_deps().mam_deps
			
			const file = this.file()

			let name_parts = file.name().split('.')

			while( name_parts.length > 2 ) {

				name_parts.splice( -2, 1 )

				const base = name_parts.slice( 0, -1 ).join( '.' )
				for( const ext of [ '.ts', '.tsx' ] ) {
					const dep = file.parent().resolve( base + ext )
					if( dep.exists() ) deps.set( dep, 10 )
				}

			}

			return deps
		}

		@ $mol_mem
		ts_source() {
			const file = this.file()
			const target = this.root().ts_options().target!
			return $node.typescript.createSourceFile( file.path(), file.text(), target )
		}

		dir_dep_add( dep_add: ( dep: $mol_file, priority: number )=> void, dep: $mol_file, priority: number ) {
			if( dep.type() !== 'dir' ) return
			const base = dep.name() + '.'

			for( const item of dep.sub() ) {
				if( item.type() !== 'file' ) continue
				if( !item.name().startsWith( base ) ) continue
				dep_add( item, priority )
			}
		}

		fqn_add( dep_add: ( dep: $mol_file, priority: number )=> void, fqn: string, priority: number ) {
			const path = fqn.replace( /[._]/g, '/' )
			const dep = this.lookup( path )
			dep_add( dep, priority )
			this.dir_dep_add( dep_add, dep, priority )
		}

		priority_of( node: ts_Node, ts_source: import('typescript').SourceFile, lines: readonly string[] ) {
			const pos = ts_source.getLineAndCharacterOfPosition( node.getStart( ts_source ) )
			const indent = /^([\s\t]*)/.exec( lines[ pos.line ] ?? '' )!
			return - indent[ 0 ].replace( /\t/g, '    ' ).length / 4
		}

		implicit_deps_add( dep_add: ( dep: $mol_file, priority: number )=> void ) {
			const file = this.file()

			if( /\.tsx$/.test( file.ext() ) ) {
				dep_add( this.lookup( 'mol/jsx' ), 0 )
			}

			if( /\.test\.tsx?$/.test( file.name() ) && file.relate( this.root().dir() ) !== 'mol/test/test.test.ts' ) {
				dep_add( this.lookup( 'mol/test' ), 0 )
			}
		}

		require_dep_add( dep_add: ( dep: $mol_file, priority: number )=> void, node: import('typescript').Identifier, priority: number ) {
			if( String( node.escapedText ) !== 'require' ) return
			if( !node.parent || !$node.typescript.isCallExpression( node.parent ) ) return
			const arg = node.parent.arguments[ 0 ]
			if( !$node.typescript.isStringLiteral( arg ) ) return

			dep_add( this.file().resolve( arg.text ), priority )
		}

		fqn_of( node: import('typescript').Identifier ) {
			return String( node.escapedText ).match( /\$([^$]*)/ )?.[1] ?? null
		}
		
		node_dep_add( node_deps: Set< string >, node: import('typescript').Identifier ) {
			const parent = ( node.parent as any )?.name?.escapedText?.[0] === '$'
				? node.parent.parent
				: node.parent

			if( parent && $node.typescript.isPropertyAccessExpression( parent ) ) {
				node_deps.add( String( parent.name.escapedText ) )
				return
			}
			
			if(
				parent &&
				$node.typescript.isElementAccessExpression( parent )
				&& $node.typescript.isStringLiteral( parent.argumentExpression )
			) {
				node_deps.add( parent.argumentExpression.text )
			}
		}

		identifier_visit(
			dep_add: ( dep: $mol_file, priority: number )=> void,
			node_deps: Set< string >,
			node: ts_Node,
			ts_source: import('typescript').SourceFile,
			lines: readonly string[],
		) {
			if( !$node.typescript.isIdentifier( node ) ) return

			const priority = this.priority_of( node, ts_source, lines )
			this.require_dep_add( dep_add, node, priority )

			const fqn = this.fqn_of( node )
			if( !fqn ) return

			if( fqn === 'node' ) this.node_dep_add( node_deps, node )
			this.fqn_add( dep_add, fqn, priority )
		}

		@ $mol_mem
		ts_source_deps() {
			const file = this.file()
			const mam_deps = new Map< $mol_file, number >()
			const node_deps: Set< string > = new Set

			if( !/tsx?$/.test( file.ext() ) ) return { mam_deps, node_deps }

			const ts_source = this.ts_source()
			const lines = file.text().split( '\n' )

			const dep_add = ( dep: $mol_file, priority: number )=> {
				const existed = mam_deps.get( dep )
				if( !existed || existed < priority ) mam_deps.set( dep, priority )
			}

			const visit = ( node: ts_Node )=> {
				this.identifier_visit( dep_add, node_deps, node, ts_source, lines )
				node.forEachChild( visit )
			}

			this.implicit_deps_add( dep_add )
			visit( ts_source )

			return { mam_deps, node_deps }
		}

	}

}
