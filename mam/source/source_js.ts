namespace $ {

	export class $mam_source_js extends $mam_source {

		static match( file: $mol_file ): boolean {
			return /\.js$/.test( file.ext() )
		}

		@ $mol_mem
		deps() {
			const deps = super.deps()

			const file = this.file()
			const lines = file.text()
				.replace( /\/\*[^]*?\*\//g, '' )
				.replace( /\/\/.*$/gm, '' )
				.split( '\n' )

			for( const line of lines ) {

				const indent = /^([\s\t]*)/.exec( line )!
				const priority = -indent[ 0 ].replace( /\t/g, '    ' ).length / 4
				
				line.replace(
					/\b(?:require|import)\(\s*['"]([^"'()]*?)['"]\s*\)|\bimport\s+(?:[^'"]+?\s+from\s+)?['"]([^"'()]*?)['"]/ig,
					( str, path_call, path_static )=> {
						let path = path_call || path_static
						path = path.replace( /(\/[^\/.]+)$/, '$1.js' ).replace( /\/$/, '/index.js' )
						if( path[0] === '.' ) path = '../' + path

						const dep = this.root().dir().resolve( path )
						deps.set( dep, priority )
						return str
					}
				)

				line.replace(
					/\$([a-z][a-z0-9]*(?:[._][a-z0-9]+)*)/ig,
					( str, fqn )=> {
						deps.set( this.lookup( fqn.replace( /[._]/g, '/' ) ), priority )
						return str
					}
				)
			}

			return deps
		}
		
	}

}
