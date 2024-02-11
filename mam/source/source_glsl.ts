namespace $ {

	export class $mam_source_glsl extends $mam_source {

		static match( file: $mol_file ): boolean {
			return /\.glsl?$/.test( file.name() )
		}

		@ $mol_mem
		deps() {
			const deps = super.deps()
			deps.set( this.lookup( 'mol/3d/glsl' ), 0 )

			var lines = String( this.file().text() )
			.replace( /\/\*[^]*?\*\//g, '' ) // drop block comments
			.replace( /\/\/.*$/gm, '' ) // drop inline comments
			.split( '\n' )
			
			lines.forEach(
				( line )=> {
					
					var indent = /^([\s\t]*)/.exec( line )!
					var priority = -indent[ 0 ].replace( /\t/g, '    ' ).length / 4
					
					line.replace(
						/([a-z][a-z0-9]+(?:_+[a-z0-9]+)+)/ig, ( str, name )=> {
							
							const path = name.split( /_+/g )
							if( path[0] === 'gl' ) return str
							
							deps.set( this.lookup( path ), - indent.length )

							return str
							
						}
					)
					
				}
			)

			return deps
		}

	}

}
