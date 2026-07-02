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

		@ $mol_mem
		generated_artifacts() {

			this.source().text() // реактивность на смену версии пакета

			const name = this.name()

			const builtins = ( $node[ 'node:module' ] as typeof import('node:module') ).builtinModules

			// ${''} — чтобы эвристика CommonJS в bundle_js не сочла этот модуль CJS-файлом
			const built = $node.esbuild.buildSync({
				stdin: {
					contents: `module.${''}exports = require${''}( ${ JSON.stringify( name ) } )`,
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

			const target = this.source().parent().resolve( `-mam/web.js` )

			target.text( [
				'var $node = $node || {}',
				`void function( module ) { var ${''}exports = module.${''}exports`,
				built.outputFiles[ 0 ].text,
				`$node[ ${ JSON.stringify( name ) } ] = module.${''}exports`,
				'}.call( {}, { exports: {} } )',
			].join( '\n' ) )

			return [ target ]
		}

	}

}
