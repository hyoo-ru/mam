namespace $ {

	type GraphqlLib = typeof import( 'graphql' )
	type DocumentNode = ReturnType< GraphqlLib[ 'parse' ] >
	type DefinitionNode = DocumentNode[ 'definitions' ][ number ]
	type TypeNode = {
		kind : string
		type? : TypeNode
		name? : { value : string }
	}
	type OpNode = {
		operation : 'query' | 'mutation' | 'subscription',
		name? : { value : string },
		loc? : { start : number, end : number },
		variableDefinitions? : Array< {
			variable : { name : { value : string } },
			type : TypeNode,
		} >,
	}

	const $mam_convert_gql_roots = {
		query : 'Query',
		mutation : 'Mutation',
		subscription : 'Subscription',
	} as const

	const $mam_convert_gql_builtin_scalars : Readonly< Record< string, string > > = {
		Int : 'number',
		Float : 'number',
		String : 'string',
		ID : 'string',
		Boolean : 'boolean',
	}

	const $mam_convert_gql_known_scalars : Readonly< Record< string, string > > = {
		DateTime : 'string',
		Date : 'string',
		Time : 'string',
		JSON : 'unknown',
		UUID : 'string',
		BigInt : 'string',
		Decimal : 'string',
	}

	const $mam_convert_gql_schema_regex = /\.schema\.(gql|graphql)$/

	/**
	 * GraphQL operation transpiler: `.gql`/`.graphql` → flat const objects
	 * (`{ query, in, out }`) в `namespace $`, плюс sub-namespace со схемой типов.
	 * Сгенерированный код zero-deps — никаких ссылок на runtime, чистые данные.
	 */
	export class $mam_convert_gql extends $mam_convert {

		static match( file: $mol_file ): boolean {
			return /\.(gql|graphql)$/.test( file.name() )
		}

		class_name() {
			const source = this.source()
			const parent = source.parent().relate( this.root().dir() )
			const file_base = source.name().replace( /\.(schema\.)?(gql|graphql)$/, '' )
			const parts = parent ? parent.split( '/' ).filter( Boolean ) : []
			if( file_base ) parts.push( file_base )
			return '$' + parts.join( '_' )
		}

		is_schema_file() {
			return $mam_convert_gql_schema_regex.test( this.source().name() )
		}

		/**
		 * Тексты внешних `*.schema.gql` найденных выше по дереву до корня.
		 * Operation-файл подмешивает их при сборке schema_defs.
		 */
		@ $mol_mem
		external_schemas(): string[] {
			const result: string[] = []
			const source = this.source()
			const root_dir = this.root().dir()
			const root_depth = root_dir.path().split( '/' ).length
			let dir = source.parent()

			while( dir.path().split( '/' ).length >= root_depth ) {
				for( const sub of dir.sub() ) {
					if( sub === source ) continue
					if( sub.type() !== 'file' ) continue
					if( !$mam_convert_gql_schema_regex.test( sub.name() ) ) continue
					result.push( sub.text() )
				}
				if( dir === root_dir ) break
				dir = dir.parent()
			}

			return result
		}

		@ $mol_mem
		generated_sources() {
			const source = this.source()
			const script = source.parent().resolve( `-gql/${ source.name() }.ts` )

			const code = this.compile()
			script.text( code )

			return [ script ]
		}

		compile(): string {
			const source = this.source()
			const gql = $node.graphql as GraphqlLib
			const Kind = gql.Kind

			let own_doc: DocumentNode
			const external_docs: DocumentNode[] = []
			try {
				own_doc = gql.parse( source.text() )
				for( const text of this.external_schemas() ) external_docs.push( gql.parse( text ) )
			} catch( error ) {
				const message = ( error as Error ).message.replace( /\*\//g, '* /' )
				return `namespace $ {\n\t/* mam_convert_gql parse error: ${ message } */\n}\n`
			}

			const class_name = this.class_name()
			const schema_defs = this.collect_schema_defs( own_doc, external_docs, Kind )
			const root_types = this.collect_root_types( schema_defs, Kind )
			const operations = this.is_schema_file()
				? []
				: ( own_doc.definitions as DefinitionNode[] ).filter( def => def.kind === Kind.OPERATION_DEFINITION )

			const types_code = this.render_types( schema_defs, Kind )
			const operations_code = this.render_operations( operations, root_types, class_name, source.text(), Kind )

			const types_block = types_code
				? [ `namespace $.${ class_name } {`, types_code, '}' ].join( '\n' )
				: ''
			const ops_block = operations_code
				? [ 'namespace $ {', operations_code, '}' ].join( '\n' )
				: ''

			return [ types_block, ops_block ].filter( Boolean ).join( '\n\n' ) + '\n'
		}

		/**
		 * Дедуп по имени: что объявлено в самом файле — приоритетнее внешней схемы.
		 * Это даёт пользователю override-механизм inline в operations-файле.
		 */
		collect_schema_defs(
			own_doc: DocumentNode,
			external_docs: DocumentNode[],
			Kind: GraphqlLib[ 'Kind' ],
		): DefinitionNode[] {
			const seen = new Set< string >()
			const result: DefinitionNode[] = []

			const add_defs = ( defs: DefinitionNode[] ) => {
				for( const def of defs ) {
					if( def.kind === Kind.OPERATION_DEFINITION ) continue
					if( def.kind === Kind.FRAGMENT_DEFINITION ) continue
					const name = ( def as { name?: { value: string } } ).name?.value
					if( !name || seen.has( name ) ) continue
					seen.add( name )
					result.push( def )
				}
			}

			add_defs( own_doc.definitions as DefinitionNode[] )
			for( const doc of external_docs ) add_defs( doc.definitions as DefinitionNode[] )

			return result
		}

		collect_root_types( defs: DefinitionNode[], Kind: GraphqlLib[ 'Kind' ] ): Set< string > {
			const roots = new Set< string >()
			const root_names = new Set< string >( Object.values( $mam_convert_gql_roots ) )
			for( const def of defs ) {
				if( def.kind !== Kind.OBJECT_TYPE_DEFINITION ) continue
				const name = ( def as { name?: { value: string } } ).name?.value
				if( name && root_names.has( name ) ) roots.add( name )
			}
			return roots
		}

		render_type_ref( node: TypeNode, scope: string, Kind: GraphqlLib[ 'Kind' ] ): string {
			if( node.kind === Kind.NON_NULL_TYPE ) return this.render_type_ref( node.type!, scope, Kind )
			// Inner-of-list nullability определяется самим inner-узлом (NonNull или нет).
			if( node.kind === Kind.LIST_TYPE ) return `readonly ( ${ this.render_type_nullable( node.type!, scope, Kind ) } )[]`
			if( node.kind === Kind.NAMED_TYPE ) {
				const name = node.name!.value
				const builtin = $mam_convert_gql_builtin_scalars[ name ]
				if( builtin ) return builtin
				return scope ? `${ scope }.${ name }` : name
			}
			return 'unknown'
		}

		render_type_nullable( node: TypeNode, scope: string, Kind: GraphqlLib[ 'Kind' ] ): string {
			if( node.kind === Kind.NON_NULL_TYPE ) return this.render_type_ref( node.type!, scope, Kind )
			return `${ this.render_type_ref( node, scope, Kind ) } | null`
		}

		render_types( defs: DefinitionNode[], Kind: GraphqlLib[ 'Kind' ] ): string {
			const lines: string[] = []

			for( const def of defs ) {
				const name = ( def as { name?: { value: string } } ).name?.value
				if( !name ) continue

				if( def.kind === Kind.SCALAR_TYPE_DEFINITION ) {
					if( $mam_convert_gql_builtin_scalars[ name ] ) continue
					lines.push( `\texport type ${ name } = ${ $mam_convert_gql_known_scalars[ name ] ?? 'string' }` )
					continue
				}

				if( def.kind === Kind.ENUM_TYPE_DEFINITION ) {
					const values = ( ( def as any ).values as { name: { value: string } }[] )
						.map( v => JSON.stringify( v.name.value ) )
						.join( ' | ' )
					lines.push( `\texport type ${ name } = ${ values || 'never' }` )
					continue
				}

				if(
					def.kind === Kind.OBJECT_TYPE_DEFINITION
					|| def.kind === Kind.INTERFACE_TYPE_DEFINITION
					|| def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION
				) {
					const fields = ( ( ( def as any ).fields ?? [] ) as Array< {
						name: { value: string },
						type: TypeNode,
					} > ).map( field => {
						const nullable = field.type.kind !== Kind.NON_NULL_TYPE
						const key = JSON.stringify( field.name.value )
						const optional = nullable ? '?' : ''
						return `\t\treadonly ${ key }${ optional } : ${ this.render_type_nullable( field.type, '', Kind ) }`
					} ).join( '\n' )
					lines.push( `\texport interface ${ name } {\n${ fields }\n\t}` )
					continue
				}

				if( def.kind === Kind.UNION_TYPE_DEFINITION ) {
					const members = ( ( def as any ).types as { name: { value: string } }[] )
						.map( t => t.name.value )
						.join( ' | ' )
					lines.push( `\texport type ${ name } = ${ members || 'never' }` )
					continue
				}
			}

			return lines.join( '\n' )
		}

		/**
		 * Result типизируется как **полный** root-тип (Query/Mutation/Subscription),
		 * а не как reconstruction из selection set — намеренный design trade-off
		 * (selection-set парсер сложен; от unsound доступа к не-selected полям защищает
		 * валидация на сервере).
		 */
		render_operations(
			operations: DefinitionNode[],
			root_types: Set< string >,
			prefix: string,
			source_text: string,
			Kind: GraphqlLib[ 'Kind' ],
		): string {
			const rendered = ( operations as OpNode[] )
				.map( op => this.render_operation( op, root_types, prefix, source_text, Kind ) )
				.filter( ( m ): m is string => m !== null )

			return rendered.join( '\n' )
		}

		render_operation(
			op: OpNode,
			root_types: Set< string >,
			prefix: string,
			source_text: string,
			Kind: GraphqlLib[ 'Kind' ],
		): string | null {
			const op_name = op.name?.value
			if( !op_name ) return null

			const full_name = `${ prefix }_${ this.camel_to_snake( op_name ) }`
			const vars = op.variableDefinitions ?? []

			const vars_type = vars.length
				? `{ ${ vars.map( v => {
					const nullable = v.type.kind !== Kind.NON_NULL_TYPE
					return `${ v.variable.name.value }${ nullable ? '?' : '' } : ${ this.render_type_nullable( v.type, '', Kind ) }`
				} ).join( ', ' ) } }`
				: 'undefined'

			const vars_runtime = vars.length ? '{}' : 'undefined'

			const root_name = $mam_convert_gql_roots[ op.operation ]
			const result_type = root_types.has( root_name ) ? `${ prefix }.${ root_name }` : 'unknown'

			const op_src = source_text.substring( op.loc!.start, op.loc!.end )

			return [
				`\texport const ${ full_name } = {`,
				`\t\tquery: ${ JSON.stringify( op_src ) },`,
				`\t\tin: ${ vars_runtime } as ${ vars_type },`,
				`\t\tout: {} as ${ result_type },`,
				`\t}`,
			].join( '\n' )
		}

		camel_to_snake( s: string ): string {
			return s.replace( /([a-z0-9])([A-Z])/g, '$1_$2' ).toLowerCase()
		}

	}

}
