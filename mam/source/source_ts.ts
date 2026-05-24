namespace $ {

	type ts_Node = import('typescript').Node
	type ts_Identifier = import('typescript').Identifier
	type ts_SourceFile = import('typescript').SourceFile

	export class $mam_source_ts extends $mam_source {

		static match( file: $mol_file ): boolean {
			return /tsx?$/.test( file.ext() )
		}
		
		@ $mol_mem
		deps() {
			const deps = this.ts_source_deps().mam_deps

			return deps
		}

		@ $mol_mem
		ts_source() {
			const file = this.file()
			return $node.typescript.createSourceFile( file.path(), file.text(), this.root().ts_options().target!, true )
		}

		priority_of( node: ts_Node, source: ts_SourceFile, lines: readonly string[] ) {
			const pos = source.getLineAndCharacterOfPosition( node.getStart( source ) )
			return this.priority( lines[ pos.line ] ?? '' )
		}

		fqn( node: ts_Identifier ) {
			return String( node.escapedText ).match( /\$([^$]*)/ )?.[ 1 ] ?? null
		}

		path_add( deps: Map< $mol_file, number >, path: string, priority: number ) {
			if( $node_internal_check( path ) ) return

			const dep = path[0] === '.'
				? this.file().resolve( path )
				: this.root().dir().resolve( path )
			this.dep_add( deps, dep, priority )
		}

		node_dep_add( node_deps: Set< string >, node: ts_Identifier ) {
			const ts = $node.typescript
			const parent = node.parent

			if( ts.isPropertyAccessExpression( parent ) ) {
				node_deps.add( String( parent.name.escapedText ) )
			} else if( ts.isElementAccessExpression( parent ) && ts.isStringLiteral( parent.argumentExpression ) ) {
				node_deps.add( parent.argumentExpression.text )
			}
		}

		implicit_deps_add( deps: Map< $mol_file, number > ) {
			const file = this.file()

			if( /\.tsx$/.test( file.ext() ) ) this.dep_add( deps, this.lookup( 'mol/jsx' ), 0 )

			if( /\.test\.tsx?$/.test( file.name() ) && file.relate( this.root().dir() ) !== 'mol/test/test.test.ts' ) {
				this.dep_add( deps, this.lookup( 'mol/test' ), 0 )
			}
		}

		node_visit(
			deps: Map< $mol_file, number >,
			node_deps: Set< string >,
			node: ts_Node,
			source: ts_SourceFile,
			lines: readonly string[],
		) {
			const ts = $node.typescript
			const priority = this.priority_of( node, source, lines )

			if( ts.isImportDeclaration( node ) && ts.isStringLiteral( node.moduleSpecifier ) ) {
				this.path_add( deps, node.moduleSpecifier.text, priority )
			}

			if( ts.isCallExpression( node ) && ts.isIdentifier( node.expression ) && node.expression.escapedText === 'require' ) {
				const arg = node.arguments[ 0 ]
				if( ts.isStringLiteral( arg ) ) this.path_add( deps, arg.text, priority )
			}

			if( ts.isCallExpression( node ) && node.expression.kind === ts.SyntaxKind.ImportKeyword ) {
				const arg = node.arguments[ 0 ]
				if( ts.isStringLiteral( arg ) ) this.path_add( deps, arg.text, priority )
			}

			if( ts.isImportTypeNode( node ) && ts.isLiteralTypeNode( node.argument ) ) {
				const arg = node.argument.literal
				if( ts.isStringLiteral( arg ) ) this.path_add( deps, arg.text, priority )
			}

			if( ts.isIdentifier( node ) ) {
				const fqn = this.fqn( node )
				if( fqn === 'node' ) this.node_dep_add( node_deps, node )
				if( fqn ) this.fqn_add( deps, fqn, priority )
			}

			node.forEachChild( child => this.node_visit( deps, node_deps, child, source, lines ) )
		}

		@ $mol_mem
		ts_source_deps() {
			const mam_deps = new Map< $mol_file, number >()
			const node_deps = new Set< string >
			const source = this.ts_source()

			this.implicit_deps_add( mam_deps )
			this.node_visit( mam_deps, node_deps, source, source, this.file().text().split( '\n' ) )

			return { mam_deps, node_deps }
		}

	}

}
