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
			const dep = this.path_resolve( path )
			if( dep ) this.dep_add( deps, dep, priority )
		}

		node_dep_add(
			deps: Map< $mol_file, number >,
			node_deps: Set< string >,
			node_dep_members: Map< string, Set< string > | null >,
			node: ts_Identifier,
			priority: number,
		) {
			const ts = $node.typescript
			const parent = node.parent

			let name = ''
			if( ts.isPropertyAccessExpression( parent ) && parent.expression === node ) {
				name = String( parent.name.escapedText )
			} else if( ts.isElementAccessExpression( parent ) && parent.expression === node && ts.isStringLiteral( parent.argumentExpression ) ) {
				name = parent.argumentExpression.text
			}
			if( !name ) return

			node_deps.add( name )

			// использованные члены пакета — для tree-shaking; null — пакет нужен целиком
			const outer = parent.parent
			let member = ''
			if( ts.isPropertyAccessExpression( outer ) && outer.expression === parent ) {
				member = String( outer.name.escapedText )
			} else if( ts.isElementAccessExpression( outer ) && outer.expression === parent && ts.isStringLiteral( outer.argumentExpression ) ) {
				member = outer.argumentExpression.text
			}

			if( member ) {
				let existed = node_dep_members.get( name )
				if( existed !== null ) {
					if( !existed ) node_dep_members.set( name, existed = new Set() )
					existed.add( member )
				}
			} else {
				node_dep_members.set( name, null )
			}

			if( $node_internal_check( name ) ) return
			if( name === 'internal' ) return

			this.$.$node_autoinstall( name )

			// пакет входит в граф своим package.json — на нём срабатывает $mam_convert_npm
			this.dep_add( deps, this.root().dir().resolve( `node_modules/${ name }/package.json` ), priority )
		}

		implicit_deps_add( deps: Map< $mol_file, number > ) {
			const file = this.file()

			if( /\.tsx$/.test( file.name() ) ) this.dep_add( deps, this.lookup( 'mol/jsx' ), 0 )

			if( /\.test\.tsx?$/.test( file.name() ) && file.relate( this.root().dir() ) !== 'mol/test/test.test.ts' ) {
				this.dep_add( deps, this.lookup( 'mol/test' ), 0 )
			}
		}

		node_visit(
			deps: Map< $mol_file, number >,
			node_deps: Set< string >,
			node_dep_members: Map< string, Set< string > | null >,
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
				if( fqn === 'node' || fqn === 'npm' ) this.node_dep_add( deps, node_deps, node_dep_members, node, priority )
				if( fqn ) this.fqn_add( deps, fqn, priority )
			}

			node.forEachChild( child => this.node_visit( deps, node_deps, node_dep_members, child, source, lines ) )
		}

		@ $mol_mem
		ts_source_deps() {
			const mam_deps = new Map< $mol_file, number >()
			const node_deps = new Set< string >
			const node_dep_members = new Map< string, Set< string > | null >()
			const source = this.ts_source()

			this.implicit_deps_add( mam_deps )
			this.node_visit( mam_deps, node_deps, node_dep_members, source, source, this.file().text().split( '\n' ) )

			return { mam_deps, node_deps, node_dep_members }
		}

	}

}
