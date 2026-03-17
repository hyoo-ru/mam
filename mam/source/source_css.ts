namespace $ {

	export class $mam_source_css extends $mam_source {

		static match( file: $mol_file ): boolean {
			return /\.css?$/.test( file.name() )
		}

		@ $mol_mem
		deps() {
			const deps = super.deps()
			deps.set( this.lookup( 'mol/style/attach' ), 0 )

			var lines = String( this.file().text() )
			.replace( /\/\*[^]*?\*\//g , '' ) // drop block comments
			.replace( /\/\/.*$/gm , '' ) // drop inline comments
			.split( '\n' )
			
			lines.forEach(
				( line )=> {
					var indent = /^([\s\t]*)/.exec( line )!
					var priority = -indent[ 0 ].replace( /\t/g , '    ' ).length / 4
					
					line.replace(
						/(?:--|\[)([a-z][a-z0-9]+(?:[_][a-z0-9]+)+)/ig , ( str , name )=> {

							deps.set( this.lookup( name.replace( /[._-]/g , '/' ) ), priority )
							return str
						}
					)
				}
			)

			return deps
		}

	}

}
