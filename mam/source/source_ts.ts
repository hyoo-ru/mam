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

			const dep_add = ( dep: $mol_file, priority: number )=> {
				const existed = mam_deps.get( dep )
				if( !existed || existed < priority ) mam_deps.set( dep, priority )

				const file_priority = priority
				const add_primary_files = ( dir: $mol_file )=> {
					const base = dir.name()
					for( const name of [
						`${base}.ts`,
						`${base}.node.ts`,
						`${base}.web.ts`,
						`${base}.test.ts`,
						`${base}.node.test.ts`,
						`${base}.web.test.ts`,
						`${base}.tsx`,
						`${base}.test.tsx`,
						`${base}.view.ts`,
						`${base}.view.tsx`,
						`${base}.view.tree`,
						`${base}.view.tree.ts`,
						`${base}.view.css.ts`,
					] ) {
						const file = dir.resolve( name )
						if( !file.exists() ) continue
						const existed = mam_deps.get( file )
						if( !existed || existed < file_priority ) mam_deps.set( file, file_priority )
					}
				}

				const dep_dir = dep.type() === 'file' ? dep.parent() : dep
				if( dep_dir.path() !== file.parent().path() ) add_primary_files( dep_dir )
			}

			if( /\.tsx$/.test( file.ext() ) ) {
				dep_add( this.lookup( 'mol/jsx' ), 0 )
			}

			if( /\.test\.tsx?$/.test( file.name() ) && file.relate( this.root().dir() ) !== 'mol/test/test.test.ts' ) {
				dep_add( this.lookup( 'mol/test' ), 0 )
			}

			const fqn_add = ( fqn: string, priority: number )=> {
				const path = fqn.replace( /[._]/g, '/' )
				
				dep_add( this.lookup( path ), priority )
				
				const parts = path.split( '/' )
				for( let index = parts.length; index > 0; --index ) {
					const prefix = parts.slice( 0, index ).join( '/' )
					const file = this.root().dir().resolve( prefix )
					
					if( file.type() === 'file' ) {
						dep_add( file, priority )
						return
					}
					
					const dir = file.parent()
					const base = file.name()
					
					for( const name of [
						`${base}.ts`,
						`${base}.tsx`,
						`${base}.view.tree`,
						`${base}.view.ts`,
						`${base}.view.tsx`,
						`${base}.view.css.ts`,
					] ) {
						const primary = dir.resolve( name )
						if( !primary.exists() ) continue
						dep_add( primary, priority )
						return
					}
					
					if( file.exists() ) {
						dep_add( file, priority )
						return
					}
				}
				
				dep_add( this.lookup( path ), priority )
			}

			const lines = file.text().split( '\n' )
			const priority_of = ( node: ts_Node, parents: ts_Node[] )=> {
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
				if( !in_func && parents.some( parent =>
					$node.typescript.isExpressionStatement( parent )
					|| $node.typescript.isVariableDeclaration( parent )
					|| $node.typescript.isIfStatement( parent )
				) ) return 10
				const pos = ts_source.getLineAndCharacterOfPosition( node.getStart( ts_source ) )
				const indent = /^([\s\t]*)/.exec( lines[ pos.line ] ?? '' )!
				return - indent[0].replace( /\t/g, '    ' ).length / 4
			}

			const visit = ( node: ts_Node, parents: ts_Node[] ) => {
				if( !$node.typescript.isIdentifier( node ) ) {
					node.forEachChild( ( child: ts_Node ) => visit( child, [ ...parents, node ] ) )
					return
				}
				
				const priority = priority_of( node, parents )
				const text = ( node as import('typescript').Identifier ).escapedText as string
				const parent = parents.at( -1 )!
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

				if( text === 'require' && $node.typescript.isCallExpression( parent ) ) {

					const arg = ( parent as import('typescript').CallExpression ).arguments[ 0 ]
					if( !$node.typescript.isStringLiteral( arg ) ) return

					const dep = this.file().resolve( ( arg as import('typescript').StringLiteral ).text )
					dep_add( dep, priority )
					
					return
				}

				const fqn = text.match( /\$([^$]*)/ )?.[1]
				if( !fqn ) return

				if( fqn === 'node' ) {

					let parent = (parents.at(-1) as any)?.name?.escapedText?.[0] === '$'
						? parents.at(-2)!
						: parents.at(-1)!

					if( $node.typescript.isPropertyAccessExpression( parent ) ) {
						node_deps.add( ( parent as import('typescript').PropertyAccessExpression ).name.escapedText as string )
					}
					else if( $node.typescript.isElementAccessExpression( parent ) 
						&& $node.typescript.isStringLiteral( ( parent as import('typescript').ElementAccessExpression ).argumentExpression ) ) {
						node_deps.add( ( ( parent as import('typescript').ElementAccessExpression ).argumentExpression as import('typescript').StringLiteral ).text )
					}

				}

				fqn_add( fqn, priority )
			}

			ts_source.forEachChild( ( child: ts_Node ) => visit( child, [ ts_source ] ) )

			node_deps.forEach( name => {
				if( $node_internal_check( name ) ) return
				if( name === 'internal' ) return
				this.$.$node_autoinstall( name )
			} )

			return { mam_deps, node_deps }
		}

	}

}
