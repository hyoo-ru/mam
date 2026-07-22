namespace $ {

	/** Сборка npm-пакета в самодостаточный веб-чанк: ESM/CJS-интероп и tree-shaking через esbuild. */
	export class $mam_convert_npm extends $mam_convert {

		static match( file: $mol_file ): boolean {
			if( file.name() !== 'package.json' ) return false

			const parent = file.parent()
			const scope = parent.parent()

			if( scope.name() === 'node_modules' ) return !parent.name().startsWith( '@' )
			return scope.name().startsWith( '@' ) && scope.parent().name() === 'node_modules'
		}

		@ $mol_mem
		name() {
			const parent = this.source().parent()
			const scope = parent.parent()
			return scope.name().startsWith( '@' ) ? `${ scope.name() }/${ parent.name() }` : parent.name()
		}

		/** Использованные слайсом члены пакета. null — пакет нужен целиком. */
		@ $mol_mem_key
		members( slice: $mam_slice ): string[] | null {

			const name = this.name()
			const members = new Set< string >()

			for( const file of slice.graph().sorted ) {

				const source = this.root().source( [ this.$.$mam_source_ts, file ] )
				if( !source ) continue

				const file_members = source.ts_source_deps().npm.members.get( name )
				if( file_members === undefined ) continue
				if( file_members === null ) return null

				for( const member of file_members ) members.add( member )

			}

			return [ ... members ].sort()
		}

		entry_all() {
			return `module.${''}exports = require${''}( ${ JSON.stringify( this.name() ) } )`
		}

		build( contents: string ) {

			const builtins = ( $node[ 'node:module' ] as typeof import('node:module') ).builtinModules

			const built = $node.esbuild.buildSync({
				stdin: {
					contents,
					resolveDir: this.root().dir().path(),
					loader: 'js',
				},
				bundle: true,
				platform: 'browser',
				format: 'cjs',
				treeShaking: true,
				// билтины остаются require('fs') и на вебе разрешаются в undefined
				external: [ ... builtins, ... builtins.map( name => 'node:' + name ) ],
				write: false,
				logLevel: 'silent',
			})

			return built.outputFiles[ 0 ].text
		}

		@ $mol_mem_key
		artifacts_for( slice: $mam_slice ) {

			// на ноде пакеты подтягиваются рантайм-прокси, чанк нужен только вебу
			if( !/^web/.test( slice.prefix() ) ) return []

			this.source().text() // реактивность на смену версии пакета

			const name = this.name()
			const members = this.members( slice )

			const named = !!members?.length && members.every( member => /^[A-Za-z_$][\w$]*$/.test( member ) )

			let chunk = ''
			try {
				chunk = this.build( named
					? `export { ${ members!.join( ', ' ) } } from ${ JSON.stringify( name ) }`
					: this.entry_all()
				)
			} catch( error ) {
				if( $mol_promise_like( error ) ) $mol_fail_hidden( error )
				if( !named ) $mol_fail_hidden( error )
				// именованные экспорты не разрезолвились статически — берём пакет целиком
				this.$.$mol_fail_log( error )
				chunk = this.build( this.entry_all() )
			}

			const target = this.source().parent().resolve( `-mam/${ slice.prefix() }.js` )

			target.text( [
				'var $node = $node || {}',
				'var $npm = $npm || {}',
				`void function( module ) { var ${''}exports = module.${''}exports`,
				chunk,
				`$npm[ ${ JSON.stringify( name ) } ] = $node[ ${ JSON.stringify( name ) } ] = module.${''}exports`,
				'}.call( {}, { exports: {} } )',
			].join( '\n' ) )

			return [ target ]
		}

	}

}
