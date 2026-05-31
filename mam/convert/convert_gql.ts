namespace $ {

	type DocumentNode = ReturnType< typeof import( 'graphql' )[ 'parse' ] >
	type DefinitionNode = DocumentNode[ 'definitions' ][ number ]
	type TypeNode = { kind: string, type?: TypeNode, name?: { value: string } }
	type OpNode = {
		operation: 'query' | 'mutation' | 'subscription',
		name?: { value: string },
		loc?: { start: number, end: number },
		variableDefinitions?: Array<{ variable: { name: { value: string } }, type: TypeNode }>,
	}

	/**
	 * GraphQL operation transpiler: `.gql`/`.graphql` → flat const objects
	 * (`{ query, in, out }`) в `namespace $`, плюс sub-namespace со схемой типов.
	 * Сгенерированный код zero-deps — никаких ссылок на runtime, чистые данные.
	 */
	export class $mam_convert_gql extends $mam_convert {

		static match( file: $mol_file ): boolean {
			return /\.(gql|graphql)$/.test( file.name() )
		}

		static schema_regex = /\.schema\.(gql|graphql)$/

		static roots = {
			query: 'Query',
			mutation: 'Mutation',
			subscription: 'Subscription',
		} as const

		static builtin_scalars: Readonly< Record< string, string > > = {
			Int: 'number',
			Float: 'number',
			String: 'string',
			ID: 'string',
			Boolean: 'boolean',
		}

		// Не из спеки, community-распространённые. Если нужно иное — переопредели
		// в своём `.schema.gql` через `scalar X` + добавь интерфейс с маппингом.
		static known_scalars: Readonly< Record< string, string > > = {
			DateTime: 'string',
			Date: 'string',
			Time: 'string',
			JSON: 'unknown',
			UUID: 'string',
			BigInt: 'string',
			Decimal: 'string',
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
			return $mam_convert_gql.schema_regex.test( this.source().name() )
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
					if( !$mam_convert_gql.schema_regex.test( sub.name() ) ) continue
					result.push( sub.text() )
				}
				if( dir === root_dir ) break
				dir = dir.parent()
			}

			return result
		}

		@ $mol_mem
		gql_lib() {
			return $node.graphql as typeof import( 'graphql' )
		}

		@ $mol_mem
		own_doc() {
			return this.gql_lib().parse( this.source().text() )
		}

		@ $mol_mem
		external_docs() {
			const gql = this.gql_lib()
			return this.external_schemas().map( text => gql.parse( text ) )
		}

		@ $mol_mem
		generated_sources() {
			const source = this.source()
			const script = source.parent().resolve( `-gql/${ source.name() }.ts` )
			script.text( this.compile() )
			return [ script ]
		}

		compile(): string {

			let own_doc: DocumentNode
			let external_docs: DocumentNode[]
			try {
				own_doc = this.own_doc()
				external_docs = this.external_docs()
			} catch( error ) {
				const message = ( error as Error ).message.replace( /\*\//g, '* /' )
				return `namespace $ {\n\t/* mam_convert_gql parse error: ${ message } */\n}\n`
			}

			const Kind = this.gql_lib().Kind
			const class_name = this.class_name()
			const schema_defs = this.collect_schema_defs( own_doc, external_docs )
			const root_types = this.collect_root_types( schema_defs )
			const operations = this.is_schema_file()
				? []
				: ( own_doc.definitions as DefinitionNode[] ).filter( def => def.kind === Kind.OPERATION_DEFINITION )

			const types_code = this.render_types( schema_defs )
			const operations_code = this.render_operations( operations, root_types, class_name, this.source().text() )

			const blocks: string[] = []
			if( types_code ) blocks.push( `namespace $.${ class_name } {\n${ types_code }\n}` )
			if( operations_code ) blocks.push( `namespace $ {\n${ operations_code }\n}` )

			return blocks.join( '\n\n' ) + '\n'
		}

		/**
		 * Дедуп по имени: что объявлено в самом файле — приоритетнее внешней схемы.
		 * Это даёт пользователю override-механизм inline в operations-файле.
		 */
		collect_schema_defs( own_doc: DocumentNode, external_docs: DocumentNode[] ): DefinitionNode[] {
			const Kind = this.gql_lib().Kind
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

		collect_root_types( defs: DefinitionNode[] ): Set< string > {
			const Kind = this.gql_lib().Kind
			const root_names = new Set< string >( Object.values( $mam_convert_gql.roots ) )
			const roots = new Set< string >()
			for( const def of defs ) {
				if( def.kind !== Kind.OBJECT_TYPE_DEFINITION ) continue
				const name = ( def as { name?: { value: string } } ).name?.value
				if( name && root_names.has( name ) ) roots.add( name )
			}
			return roots
		}

		render_type_ref( node: TypeNode, scope: string ): string {
			const Kind = this.gql_lib().Kind
			if( node.kind === Kind.NON_NULL_TYPE ) return this.render_type_ref( node.type!, scope )
			// Inner-of-list nullability определяется самим inner-узлом (NonNull или нет).
			if( node.kind === Kind.LIST_TYPE ) return `readonly ( ${ this.render_type_nullable( node.type!, scope ) } )[]`
			if( node.kind === Kind.NAMED_TYPE ) {
				const name = node.name!.value
				const builtin = $mam_convert_gql.builtin_scalars[ name ]
				if( builtin ) return builtin
				return scope ? `${ scope }.${ name }` : name
			}
			return 'unknown'
		}

		render_type_nullable( node: TypeNode, scope: string ): string {
			const Kind = this.gql_lib().Kind
			if( node.kind === Kind.NON_NULL_TYPE ) return this.render_type_ref( node.type!, scope )
			return `${ this.render_type_ref( node, scope ) } | null`
		}

		render_types( defs: DefinitionNode[] ): string {
			const Kind = this.gql_lib().Kind
			const lines: string[] = []

			for( const def of defs ) {
				const name = ( def as { name?: { value: string } } ).name?.value
				if( !name ) continue

				if( def.kind === Kind.SCALAR_TYPE_DEFINITION ) {
					if( $mam_convert_gql.builtin_scalars[ name ] ) continue
					const mapped = $mam_convert_gql.known_scalars[ name ] ?? 'string'
					lines.push( `	export type ${ name } = ${ mapped }` )
					continue
				}

				if( def.kind === Kind.ENUM_TYPE_DEFINITION ) {
					const values = ( ( def as any ).values as { name: { value: string } }[] )
						.map( v => JSON.stringify( v.name.value ) )
						.join( ' | ' )
					lines.push( `	export type ${ name } = ${ values || 'never' }` )
					continue
				}

				if(
					def.kind === Kind.OBJECT_TYPE_DEFINITION
					|| def.kind === Kind.INTERFACE_TYPE_DEFINITION
					|| def.kind === Kind.INPUT_OBJECT_TYPE_DEFINITION
				) {
					const fields = ( ( ( def as any ).fields ?? [] ) as Array<{ name: { value: string }, type: TypeNode }> )
						.map( field => {
							const nullable = field.type.kind !== Kind.NON_NULL_TYPE
							const key = JSON.stringify( field.name.value )
							const optional = nullable ? '?' : ''
							return `		readonly ${ key }${ optional }: ${ this.render_type_nullable( field.type, '' ) }`
						} )
						.join( '\n' )
					lines.push( `	export interface ${ name } {\n${ fields }\n	}` )
					continue
				}

				if( def.kind === Kind.UNION_TYPE_DEFINITION ) {
					const members = ( ( def as any ).types as { name: { value: string } }[] )
						.map( t => t.name.value )
						.join( ' | ' )
					lines.push( `	export type ${ name } = ${ members || 'never' }` )
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
		render_operations( operations: DefinitionNode[], root_types: Set< string >, prefix: string, source_text: string ): string {
			return ( operations as OpNode[] )
				.map( op => this.render_operation( op, root_types, prefix, source_text ) )
				.filter( ( m ): m is string => m !== null )
				.join( '\n' )
		}

		render_operation( op: OpNode, root_types: Set< string >, prefix: string, source_text: string ): string | null {
			const op_name = op.name?.value
			if( !op_name ) return null

			const Kind = this.gql_lib().Kind
			const full_name = `${ prefix }_${ this.camel_to_snake( op_name ) }`
			const vars = op.variableDefinitions ?? []

			const vars_type = vars.length
				? `{ ${ vars.map( v => {
					const nullable = v.type.kind !== Kind.NON_NULL_TYPE
					return `${ v.variable.name.value }${ nullable ? '?' : '' }: ${ this.render_type_nullable( v.type, '' ) }`
				} ).join( ', ' ) } }`
				: 'undefined'
			const vars_runtime = vars.length ? '{}' : 'undefined'

			const root_name = $mam_convert_gql.roots[ op.operation ]
			const result_type = root_types.has( root_name ) ? `${ prefix }.${ root_name }` : 'unknown'

			const op_src = source_text.substring( op.loc!.start, op.loc!.end )

			return (
`	export const ${ full_name } = {
		query: ${ JSON.stringify( op_src ) },
		in: ${ vars_runtime } as ${ vars_type },
		out: {} as ${ result_type },
	}`
			)
		}

		camel_to_snake( s: string ): string {
			return s.replace( /([a-z0-9])([A-Z])/g, '$1_$2' ).toLowerCase()
		}

	}

}
