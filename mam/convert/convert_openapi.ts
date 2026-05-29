namespace $ {

	const $mam_convert_openapi_http_methods = [ 'get', 'post', 'put', 'patch', 'delete', 'head', 'options' ] as const
	type HttpMethod = typeof $mam_convert_openapi_http_methods[ number ]

	// `header` / `cookie` параметры намеренно out of scope — типовая практика
	// для них передавать через init.headers / fetchInit(), а не описывать в spec.
	const $mam_convert_openapi_param_location = {
		Path : 'path',
		Query : 'query',
	} as const

	const $mam_convert_openapi_json_mime = 'application/json'

	const $mam_convert_openapi_json_regex = /\.openapi\.json$/

	// openapi-typescript иногда печатает декларацию `$defs` для JSON-Schema 2020-12.
	// Парсится ts-dep-сканером как ссылка на пакет `/defs` → удаляем.
	// `\u0024` — escape `$`: в regex matches `$`, в исходнике видимого `$` нет
	// (иначе сам ts-dep-сканер сматчит этот regex literal).
	const $mam_convert_openapi_fake_defs = /^[ \t]*export\s+type\s+\u0024defs\s*=\s*Record\s*<\s*string\s*,\s*never\s*>\s*;?\s*$/gm

	type Parameter = { name: string, in: string }
	type Operation = {
		operationId?: string,
		parameters?: Parameter[],
		requestBody?: unknown,
		responses?: Record< string, unknown >,
	}
	type PathItem = Partial< Record< HttpMethod, Operation > >
	type Spec = { paths?: Record< string, PathItem > }

	type OperationShape = {
		full_name: string,
		params_type: string,
		params_runtime: string,
		query_type: string,
		query_runtime: string,
		body_type: string,
		body_runtime: string,
		result_type: string,
	}

	/**
	 * OpenAPI transpiler: `.openapi.yaml/yml/json` → flat const objects
	 * (`{ method, route, params, query, body, out }`) в `namespace $`, плюс
	 * sub-namespace со схемой типов из openapi-typescript.
	 */
	export class $mam_convert_openapi extends $mam_convert {

		static match( file: $mol_file ): boolean {
			return /\.openapi\.(yaml|yml|json)$/.test( file.name() )
		}

		class_name() {
			const source = this.source()
			const parent = source.parent().relate( this.root().dir() )
			const file_base = source.name().replace( /\.openapi\.(yaml|yml|json)$/, '' )
			const parts = parent ? parent.split( '/' ).filter( Boolean ) : []
			if( file_base ) parts.push( file_base )
			return '$' + parts.join( '_' )
		}

		@ $mol_mem
		spec(): Spec {
			const source = this.source()
			const text = source.text()
			if( $mam_convert_openapi_json_regex.test( source.name() ) ) return JSON.parse( text ) as Spec
			const yaml = $node.yaml as typeof import( 'yaml' )
			return yaml.parse( text ) as Spec
		}

		@ $mol_mem
		types_text(): string {
			const spec = this.spec()
			return $mol_wire_sync( this ).generate_types( spec )
		}

		// openapi-typescript v7 — pure ESM, dynamic import. Метод async, через
		// $mol_wire_sync синхронизуется. autoinstall ставит пакет если нужно.
		async generate_types( spec: unknown ): Promise< string > {
			this.$.$node_autoinstall( 'openapi-typescript' )
			const mod = await import( 'openapi-typescript' ) as Record< string, unknown >
			const fn = ( mod.default ?? mod.openapiTS ?? mod ) as ( spec: unknown ) => unknown
			const ast = await fn( spec )
			return typeof ast === 'string' ? ast : this.ast_to_text( ast as readonly unknown[] )
		}

		/** Сериализация AST из openapi-typescript v7 (если вернулся не текст). */
		ast_to_text( ast: readonly unknown[] ): string {
			const ts = $node.typescript as typeof import( 'typescript' )
			const file = ts.createSourceFile( 'out.d.ts', '', ts.ScriptTarget.Latest, false, ts.ScriptKind.TS )
			const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed })
			return ast
				.map( node => printer.printNode( ts.EmitHint.Unspecified, node as Parameters< typeof printer.printNode >[ 1 ], file ) )
				.join( '\n' )
		}

		@ $mol_mem
		generated_sources() {
			const source = this.source()
			const script = source.parent().resolve( `-openapi/${ source.name() }.ts` )

			const code = this.compile()
			script.text( code )

			return [ script ]
		}

		compile(): string {
			const spec = this.spec()
			const class_name = this.class_name()

			const types_text = this.types_text().replace( $mam_convert_openapi_fake_defs, '' )
			const types_indented = types_text.split( '\n' ).map( line => line ? '\t' + line : line ).join( '\n' )
			const operations_text = this.render_operations( spec, class_name )

			const types_block = types_text
				? [ `namespace $.${ class_name } {`, types_indented, '}' ].join( '\n' )
				: ''
			const ops_block = operations_text
				? [ 'namespace $ {', operations_text, '}' ].join( '\n' )
				: ''

			return [ types_block, ops_block ].filter( Boolean ).join( '\n\n' ) + '\n'
		}

		render_operations( spec: Spec, prefix: string ): string {
			const paths = spec.paths ?? {}
			const op_ids = this.collect_operation_ids( paths )
			const seen = new Set< string >()
			const lines: string[] = []

			for( const route in paths ) {
				const item = paths[ route ]
				if( !item ) continue
				for( const method of $mam_convert_openapi_http_methods ) {
					const op = item[ method ]
					if( !op ) continue
					lines.push( this.render_operation( route, method, op, op_ids, seen, prefix ) )
				}
			}

			return lines.join( '\n' )
		}

		collect_operation_ids( paths: Record< string, PathItem > ): Set< string > {
			const ids = new Set< string >()
			for( const route in paths ) {
				const item = paths[ route ]
				if( !item ) continue
				for( const method of $mam_convert_openapi_http_methods ) {
					const op = item[ method ]
					if( op?.operationId ) ids.add( op.operationId )
				}
			}
			return ids
		}

		render_operation(
			route: string,
			method: HttpMethod,
			op: Operation,
			op_ids: Set< string >,
			seen: Set< string >,
			prefix: string,
		): string {
			const shape = this.operation_shape( route, method, op, op_ids, seen, prefix )

			return [
				`\texport const ${ shape.full_name } = {`,
				`\t\tmethod: ${ JSON.stringify( method.toUpperCase() ) },`,
				`\t\troute: ${ JSON.stringify( route ) },`,
				`\t\tparams: ${ shape.params_runtime } as ${ shape.params_type },`,
				`\t\tquery: ${ shape.query_runtime } as ${ shape.query_type },`,
				`\t\tbody: ${ shape.body_runtime } as ${ shape.body_type },`,
				`\t\tout: {} as ${ shape.result_type },`,
				`\t}`,
			].join( '\n' )
		}

		operation_shape(
			route: string,
			method: HttpMethod,
			op: Operation,
			op_ids: Set< string >,
			seen: Set< string >,
			prefix: string,
		): OperationShape {
			const op_name = this.unique_op_name( op, method, route, seen )
			const full_name = `${ prefix }_${ this.camel_to_snake( op_name ) }`

			const op_ref = op.operationId && op_ids.has( op.operationId )
				? `${ prefix }.operations[ ${ JSON.stringify( op.operationId ) } ]`
				: null

			const success_code = this.first_success_code( op )
			const result_type = ( op_ref && success_code )
				? `NonNullable< ${ op_ref }[ 'responses' ][ ${ success_code } ] extends { content : { '${ $mam_convert_openapi_json_mime }' : infer R } } ? R : unknown >`
				: 'unknown'

			const path_params = ( op.parameters ?? [] ).filter( p => p.in === $mam_convert_openapi_param_location.Path )
			const query_params = ( op.parameters ?? [] ).filter( p => p.in === $mam_convert_openapi_param_location.Query )
			const has_body = !!op.requestBody

			const params_type = path_params.length
				? ( op_ref
					? `${ op_ref }[ 'parameters' ][ 'path' ]`
					: `{ ${ path_params.map( p => `${ JSON.stringify( p.name ) } : string | number` ).join( ', ' ) } }`
				)
				: 'undefined'

			const query_type = query_params.length
				? ( op_ref
					? `${ op_ref }[ 'parameters' ][ 'query' ]`
					: `Record< string, string | number | boolean | undefined >`
				)
				: 'undefined'

			const body_type = has_body
				? ( op_ref
					? `( ${ op_ref }[ 'requestBody' ] extends { content : { '${ $mam_convert_openapi_json_mime }' : infer B } } ? B : unknown )`
					: 'unknown'
				)
				: 'undefined'

			return {
				full_name,
				params_type,
				params_runtime: path_params.length ? '{}' : 'undefined',
				query_type,
				query_runtime: query_params.length ? '{}' : 'undefined',
				body_type,
				body_runtime: has_body ? '{}' : 'undefined',
				result_type,
			}
		}

		unique_op_name( op: Operation, method: HttpMethod, route: string, seen: Set< string > ): string {
			const base = op.operationId
				?? ( method + '_' + route ).replace( /[^a-zA-Z0-9]+/g, '_' ).replace( /^_+|_+$/g, '' )
			let unique = base
			let i = 2
			while( seen.has( unique ) ) unique = `${ base }_${ i++ }`
			seen.add( unique )
			return unique
		}

		// 2xx → ASC. Если 2xx нет — fallback на `default` (валидный OpenAPI 3.x кейс).
		first_success_code( op: Operation ): string | null {
			const codes = Object.keys( op.responses ?? {} )
			const ok = codes.filter( c => /^2\d\d$/.test( c ) ).sort()
			if( ok.length ) return ok[ 0 ]
			if( codes.includes( 'default' ) ) return `'default'`
			return null
		}

		camel_to_snake( s: string ): string {
			return s.replace( /([a-z0-9])([A-Z])/g, '$1_$2' ).toLowerCase()
		}

	}

}
