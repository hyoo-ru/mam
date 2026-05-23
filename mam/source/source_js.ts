namespace $ {

	export class $mam_source_js extends $mam_source {

		static match( file: $mol_file ): boolean {
			return /\.js$/.test( file.ext() )
		}

		@ $mol_mem
		deps() {
			const deps = super.deps()

			const file = this.file()
			const source = file.text()

			const scan = ( source: string )=> {
				for( const line of source.split( '\n' ) ) {

					const priority = this.priority( line )

					for( const token of line.matchAll( $mam_source_refs_js ) ) {
						if( !token.groups ) continue

						const path_found = token.groups.path
						if( path_found ) {
							let path = path_found
							path = path.replace( /(\/[^\/.]+)$/, '$1.js' ).replace( /\/$/, '/index.js' )
							if( path[0] === '.' ) path = '../' + path

							const dep = this.root().dir().resolve( path )
							this.dep_add( deps, dep, priority )
						}

						const name = token.groups.name
						if( name ) this.fqn_add( deps, name, priority )
					}
				}
			}

			for( const token of source.matchAll( $mam_source_remarks_js ) ) {
				if( token.groups ) {
					const remark = token[0]
					if( /@jsx(?:Frag)?\s+\$/.test( remark ) ) scan( remark )
				} else {
					scan( token[0] )
				}
			}

			return deps
		}
		
	}

}
