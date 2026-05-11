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

			const fqn_add = ( fqn: string, priority: number )=> {
				const path = fqn.replace( /[._]/g, '/' )
				const dep = this.lookup( path )
				dep_add( dep, priority )
				
				if( dep.type() !== 'dir' ) return
				const base = dep.name() + '.'
				
				for( const item of dep.sub() ) {
					if( item.type() !== 'file' ) continue
					if( !item.name().startsWith( base ) ) continue
					dep_add( item, priority )
				}
			}

			const parent_chain = ( node: ts_Node )=> {
				const chain = [] as ts_Node[]
				for( let current = node.parent; current; current = current.parent ) chain.push( current )
				return chain
			}

			const priority_of = ( node: ts_Node, parents: readonly ts_Node[] )=> {
				const in_func = parents.some( parent =>
					$node.typescript.isFunctionDeclaration( parent )
					|| $node.typescript.isFunctionExpression( parent )
					|| $node.typescript.isArrowFunction( parent )
					|| $node.typescript.isMethodDeclaration( parent )
					|| $node.typescript.isConstructorDeclaration( parent )
					|| $node.typescript.isGetAccessorDeclaration( parent )
					|| $node.typescript.isSetAccessorDeclaration( parent )
				)

				if( parents.some( parent => $node.typescript.isHeritageClause( parent ) ) ) return 10
				if( parents.some( parent => $node.typescript.isPropertyDeclaration( parent ) ) ) return 10
				if( parents.some( parent => $node.typescript.isEnumMember( parent ) ) ) return 10
				if( parents.some( parent => $node.typescript.isComputedPropertyName( parent ) ) ) return 10
				if( parents.some( parent => $node.typescript.isDecorator( parent ) ) ) return 10
				if(
					!in_func
					&& parents.some( parent =>
						$node.typescript.isExpressionStatement( parent )
						|| $node.typescript.isVariableDeclaration( parent )
						|| $node.typescript.isIfStatement( parent )
					)
				) return 10

				const pos = ts_source.getLineAndCharacterOfPosition( node.getStart( ts_source ) )
				const indent = /^([\s\t]*)/.exec( lines[ pos.line ] ?? '' )!
				return - indent[ 0 ].replace( /\t/g, '    ' ).length / 4
			}

			if( /\.tsx$/.test( file.ext() ) ) {
				dep_add( this.lookup( 'mol/jsx' ), 0 )
			}

			if( /\.test\.tsx?$/.test( file.name() ) && file.relate( this.root().dir() ) !== 'mol/test/test.test.ts' ) {
				dep_add( this.lookup( 'mol/test' ), 0 )
			}

			const visit = ( node: ts_Node )=> {
				if( $node.typescript.isIdentifier( node ) ) {
					const parents = parent_chain( node )
					const in_heritage = parents.some( parent => $node.typescript.isHeritageClause( parent ) )
					const in_type = parents.some( parent =>
						$node.typescript.isTypeReferenceNode( parent )
						|| $node.typescript.isTypeAliasDeclaration( parent )
						|| $node.typescript.isInterfaceDeclaration( parent )
						|| $node.typescript.isTypeLiteralNode( parent )
						|| $node.typescript.isUnionTypeNode( parent )
						|| $node.typescript.isIntersectionTypeNode( parent )
						|| $node.typescript.isExpressionWithTypeArguments( parent )
					)
					if( in_type && !in_heritage ) return

					const priority = priority_of( node, parents )
					const text = String( node.escapedText )

					if( text === 'require' && node.parent && $node.typescript.isCallExpression( node.parent ) ) {
						const arg = node.parent.arguments[ 0 ]
						if( $node.typescript.isStringLiteral( arg ) ) dep_add( file.resolve( arg.text ), priority )
					}

					const fqn = text.match( /\$([^$]*)/ )?.[1]
					if( !fqn ) return

					if( fqn === 'node' ) {
						const parent = (node.parent as any)?.name?.escapedText?.[0] === '$'
							? node.parent.parent
							: node.parent

						if( parent && $node.typescript.isPropertyAccessExpression( parent ) ) {
							node_deps.add( String( parent.name.escapedText ) )
						}
						else if(
							parent &&
							$node.typescript.isElementAccessExpression( parent )
							&& $node.typescript.isStringLiteral( parent.argumentExpression )
						) {
							node_deps.add( parent.argumentExpression.text )
						}
					}

					fqn_add( fqn, priority )
				}

				node.forEachChild( visit )
			}

			visit( ts_source )

			node_deps.forEach( name => {
				if( $node_internal_check( name ) ) return
				if( name === 'internal' ) return
				this.$.$node_autoinstall( name )
			} )

			return { mam_deps, node_deps }
		}

	}

}
