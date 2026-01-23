namespace $ {

	export class $mam_bundle_package_json extends $mam_bundle {
		
		@ $mol_mem_key
		generated( slice: $mam_slice ) {
			const start = Date.now()

			const pack = slice.pack()
			const root_dir = slice.root().dir()

			const source = pack.dir().resolve( `package.json` )
			const target = pack.output().resolve( `package.json` )

			let name = pack.dir().relate( root_dir ).replace( /\//g, '_' )
			
			let json = {
				name,
				version: '0.0.0',
				exports: {
					node: {
						import: './node.mjs',
						default: './node.js'
					},
					types: './web.d.ts',
					import: './web.mjs',
					default: './web.js'
				},
				main: './web.js',
				module: './web.mjs',
				browser: './web.js',
				types: './web.d.ts',
				keywords: [] as string[],
				dependencies: {} as { [ key: string ]: string }
			}

			if( source.exists() ) {
				Object.assign( json, JSON.parse( source.text() ) )
			}

			let version = json.version.split('.').map( Number )
			name = json.name || name
			
			try {
				
				const published = ( [] as string[] ).concat( JSON.parse(
					this.$.$mol_exec( '', 'npm', 'view', name, 'versions', '--json' ).stdout.toString()
				) ).slice(-1)[0].split('.').map( Number )
				
				if( published[0] > version[0] ) {
					version = published
				} else if( published[0] === version[0] && published[1] > version[1] ) {
					version[1] = published[1]
				}
				
				if(!( published[2] <= version[2] )) {
					version[2] = published[2]
				}
				
			} catch {}

			++ version[2]

			json.version = version.join( '.' )

			const node_deps = /node/.test( slice.prefix() ) ? ( slice as $mam_slice_node ).node_deps(): []
			for( let dep of node_deps ) {
				if( require('module').builtinModules.includes(dep) ) continue
				json.dependencies[ dep ] = `*`
			}
			
			json.keywords = [ ... slice.graph().nodes ]
				.filter( Boolean )
				.filter( file => !/[.-]/.test( file.path() ) )
				.map( file => '$' + file.path().replaceAll( '/', '_' ) )
			
			target.text( JSON.stringify( json, null, '  ' ) )
			
			this.log( target, Date.now() - start )
			
			return [ target ]
		}

	}
	
}
