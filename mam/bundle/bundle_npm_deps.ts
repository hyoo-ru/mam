namespace $ {

	export class $mam_bundle_npm_deps extends $mam_bundle {

		repo_dir( pack: $mam_package ) {
			const root = this.root().dir()
			for( let dir = pack.dir(); dir !== root; dir = dir.parent() ) {
				if( dir.resolve( '.git' ).exists() ) return dir
			}
			return null
		}

		version( dep: string ) {
			const json = this.root().dir().resolve( `node_modules/${ dep }/package.json` )
			if( !json.exists() ) return '*'
			const version = JSON.parse( json.text() ).version
			return version ? `^${ version }` : '*'
		}

		@ $mol_mem_key
		pack_artifacts( pack: $mam_package ) {

			const dir = this.repo_dir( pack )
			if( !dir ) return []

			const deps = new Set([
				... pack.slice( this.$.$mam_slice_web_prod ).node_deps(),
				... pack.slice( this.$.$mam_slice_node_prod ).node_deps(),
			])
			if( !deps.size ) return []

			const target = dir.resolve( 'package.json' )
			const json = target.exists() ? JSON.parse( target.text() ) : {}
			const dependencies = { ... json.dependencies } as Record< string, string >

			let changed = false
			for( const dep of [ ... deps ].sort() ) {
				if( $node_internal_check( dep ) ) continue
				if( dep === 'internal' ) continue
				if( dependencies[ dep ] ) continue
				dependencies[ dep ] = this.version( dep )
				changed = true
			}
			if( !changed ) return []

			const start = Date.now()
			target.text( JSON.stringify( { ... json, dependencies }, null, '\t' ) + '\n' )
			this.log( target, Date.now() - start )

			return []
		}

	}

}
