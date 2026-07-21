namespace $ {

	type ts_Node = import('typescript').Node
	type ts_Identifier = import('typescript').Identifier
	type ts_SourceFile = import('typescript').SourceFile

	export type $mam_source_ts_deps = {
		mam_deps: Map< $mol_file, number >
		npm: $mam_source_ts_npm
	}

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

		npm_dep_add( deps: Map< $mol_file, number >, name: string, priority: number ) {

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
			ctx: $mam_source_ts_deps,
			node: ts_Node,
			source: ts_SourceFile,
			lines: readonly string[],
		) {
			const ts = $node.typescript
			const priority = this.priority_of( node, source, lines )

			if( ts.isImportDeclaration( node ) && ts.isStringLiteral( node.moduleSpecifier ) ) {
				this.path_add( ctx.mam_deps, node.moduleSpecifier.text, priority )
			}

			if( ts.isCallExpression( node ) && ts.isIdentifier( node.expression ) && node.expression.escapedText === 'require' ) {
				const arg = node.arguments[ 0 ]
				if( ts.isStringLiteral( arg ) ) this.path_add( ctx.mam_deps, arg.text, priority )
			}

			if( ts.isCallExpression( node ) && node.expression.kind === ts.SyntaxKind.ImportKeyword ) {
				const arg = node.arguments[ 0 ]
				if( ts.isStringLiteral( arg ) ) this.path_add( ctx.mam_deps, arg.text, priority )
			}

			if( ts.isImportTypeNode( node ) && ts.isLiteralTypeNode( node.argument ) ) {
				const arg = node.argument.literal
				if( ts.isStringLiteral( arg ) ) this.path_add( ctx.mam_deps, arg.text, priority )
			}

			if( ts.isIdentifier( node ) ) {

				const fqn = this.fqn( node )

				if( fqn === 'node' || fqn === 'npm' ) {
					const name = ctx.npm.dep_note( node )
					if( name ) this.npm_dep_add( ctx.mam_deps, name, priority )
				}

				if( fqn ) this.fqn_add( ctx.mam_deps, fqn, priority )

				ctx.npm.ident_note( node )

			}

			node.forEachChild( child => this.node_visit( ctx, child, source, lines ) )
		}

		@ $mol_mem
		ts_source_deps(): $mam_source_ts_deps {

			const ctx: $mam_source_ts_deps = {
				mam_deps: new Map(),
				npm: new this.$.$mam_source_ts_npm,
			}

			const source = this.ts_source()

			this.implicit_deps_add( ctx.mam_deps )
			this.node_visit( ctx, source, source, this.file().text().split( '\n' ) )
			ctx.npm.aliases_apply()

			return ctx
		}

	}

}
