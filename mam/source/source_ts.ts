namespace $ {

	type ts_Node = import('typescript').Node
	type ts_Identifier = import('typescript').Identifier
	type ts_SourceFile = import('typescript').SourceFile
	type ts_ObjectBindingPattern = import('typescript').ObjectBindingPattern

	export type $mam_source_ts_deps = {

		mam_deps: Map< $mol_file, number >
		node_deps: Set< string >

		/** Использованные члены пакетов. null — пакет нужен целиком. */
		node_dep_members: Map< string, Set< string > | null >

		/** Локальные алиасы пакетов: const yaml = $npm['yaml'] */
		aliases: Map< string, string >

		/** Сколько раз имя объявлено в файле — конфликт имён отменяет алиас-анализ */
		decls: Map< string, number >

		/** Использования идентификаторов по именам */
		usages: Map< string, ts_Identifier[] >

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

		member_add( members: Map< string, Set< string > | null >, name: string, member: string ) {
			let existed = members.get( name )
			if( existed === null ) return
			if( !existed ) members.set( name, existed = new Set() )
			existed.add( member )
		}

		/** Имя члена, взятого у выражения-пакета, или null. */
		member_of( access: ts_Node ): string | null {
			const ts = $node.typescript
			const outer = access.parent

			if( ts.isPropertyAccessExpression( outer ) && outer.expression === access ) {
				return String( outer.name.escapedText )
			}
			if( ts.isElementAccessExpression( outer ) && outer.expression === access && ts.isStringLiteral( outer.argumentExpression ) ) {
				return outer.argumentExpression.text
			}

			return null
		}

		node_dep_add( ctx: $mam_source_ts_deps, node: ts_Identifier, priority: number ) {
			const ts = $node.typescript
			const access = node.parent

			let name = ''
			if( ts.isPropertyAccessExpression( access ) && access.expression === node ) {
				name = String( access.name.escapedText )
			} else if( ts.isElementAccessExpression( access ) && access.expression === node && ts.isStringLiteral( access.argumentExpression ) ) {
				name = access.argumentExpression.text
			}
			if( !name ) return

			ctx.node_deps.add( name )

			const member = this.member_of( access )

			if( member ) {

				this.member_add( ctx.node_dep_members, name, member )

			} else {

				const outer = access.parent

				if( ts.isVariableDeclaration( outer ) && outer.initializer === access ) {

					if( ts.isIdentifier( outer.name ) ) {
						// алиас: члены соберём со всех использований имени в aliases_apply
						ctx.aliases.set( String( outer.name.escapedText ), name )
					} else if( ts.isObjectBindingPattern( outer.name ) ) {
						this.binding_members_add( ctx, name, outer.name )
					} else {
						ctx.node_dep_members.set( name, null )
					}

				} else {
					ctx.node_dep_members.set( name, null )
				}

			}

			if( $node_internal_check( name ) ) return
			if( name === 'internal' ) return

			this.$.$node_autoinstall( name )

			// пакет входит в граф своим package.json — на нём срабатывает $mam_convert_npm
			this.dep_add( ctx.mam_deps, this.root().dir().resolve( `node_modules/${ name }/package.json` ), priority )
		}

		/** Деструктуризация: const { parse, stringify: str } = $npm['yaml'] */
		binding_members_add( ctx: $mam_source_ts_deps, name: string, pattern: ts_ObjectBindingPattern ) {
			const ts = $node.typescript

			for( const element of pattern.elements ) {

				if( element.dotDotDotToken ) return void ctx.node_dep_members.set( name, null )

				const prop = element.propertyName ?? element.name

				if( ts.isIdentifier( prop ) ) this.member_add( ctx.node_dep_members, name, String( prop.escapedText ) )
				else if( ts.isStringLiteral( prop ) ) this.member_add( ctx.node_dep_members, name, prop.text )
				else return void ctx.node_dep_members.set( name, null )

			}
		}

		/** Учёт объявлений и использований имён — для алиас-анализа. */
		ident_note( ctx: $mam_source_ts_deps, node: ts_Identifier ) {
			const ts = $node.typescript
			const parent = node.parent
			const name = String( node.escapedText )

			// имена свойств — не использования переменной
			if( ts.isPropertyAccessExpression( parent ) && parent.name === node ) return
			if( ts.isPropertyAssignment( parent ) && parent.name === node ) return
			if( ts.isPropertySignature( parent ) && parent.name === node ) return
			if( ts.isMethodDeclaration( parent ) && parent.name === node ) return
			if( ts.isBindingElement( parent ) && parent.propertyName === node ) return
			if( ts.isQualifiedName( parent ) && parent.right === node ) return

			const is_decl =
				( ( ts.isVariableDeclaration( parent ) || ts.isParameter( parent ) || ts.isBindingElement( parent ) ) && parent.name === node )
				|| ( ( ts.isFunctionDeclaration( parent ) || ts.isClassDeclaration( parent ) ) && parent.name === node )

			if( is_decl ) {
				ctx.decls.set( name, ( ctx.decls.get( name ) ?? 0 ) + 1 )
			} else {
				let list = ctx.usages.get( name )
				if( !list ) ctx.usages.set( name, list = [] )
				list.push( node )
			}
		}

		/** Досбор членов пакетов с использований алиасов. */
		aliases_apply( ctx: $mam_source_ts_deps ) {
			for( const [ alias, name ] of ctx.aliases ) {

				if( ctx.node_dep_members.get( name ) === null ) continue

				// имя объявлено где-то ещё — надёжно не отследить
				if( ( ctx.decls.get( alias ) ?? 1 ) > 1 ) {
					ctx.node_dep_members.set( name, null )
					continue
				}

				for( const usage of ctx.usages.get( alias ) ?? [] ) {

					const member = this.member_of( usage )

					if( member ) {
						this.member_add( ctx.node_dep_members, name, member )
					} else {
						// значение утекает (вызов, аргумент, присваивание) — пакет целиком
						ctx.node_dep_members.set( name, null )
						break
					}

				}

			}
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
				if( fqn === 'node' || fqn === 'npm' ) this.node_dep_add( ctx, node, priority )
				if( fqn ) this.fqn_add( ctx.mam_deps, fqn, priority )
				this.ident_note( ctx, node )
			}

			node.forEachChild( child => this.node_visit( ctx, child, source, lines ) )
		}

		@ $mol_mem
		ts_source_deps(): $mam_source_ts_deps {

			const ctx: $mam_source_ts_deps = {
				mam_deps: new Map(),
				node_deps: new Set(),
				node_dep_members: new Map(),
				aliases: new Map(),
				decls: new Map(),
				usages: new Map(),
			}

			const source = this.ts_source()

			this.implicit_deps_add( ctx.mam_deps )
			this.node_visit( ctx, source, source, this.file().text().split( '\n' ) )
			this.aliases_apply( ctx )

			return ctx
		}

	}

}
