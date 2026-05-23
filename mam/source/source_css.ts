namespace $ {

	export class $mam_source_css extends $mam_source {

		static match( file: $mol_file ): boolean {
			return /\.css?$/.test( file.name() )
		}

		@ $mol_mem
		deps() {
			const deps = super.deps()
			deps.set( this.lookup( 'mol/style/attach' ), 0 )

			if( /\.view\.css$/.test( this.file().name() ) ) {
				const tree = this.file().parent().resolve( this.file().name().replace( /css$/, 'tree' ) )
				deps.set( tree, 0 )
			}

			var lines = String( this.file().text() )
			.replace( /\/\*[^]*?\*\//g , '' ) // drop block comments
			.replace( /\/\/.*$/gm , '' ) // drop inline comments
			.split( '\n' )
			
			lines.forEach(
				( line )=> {
					var priority = this.priority( line )
					
					line.replace(
						/(?:--|\[)([a-z][a-z0-9]+(?:[_][a-z0-9]+)+)/ig , ( str , name )=> {

							deps.set( this.lookup( name.replace( /[._-]/g , '/' ) ), priority )
							return str
						}
					)
					line.replace(
						/\$([a-z][a-z0-9]*(?:[._][a-z0-9]+)+)/ig , ( str , name )=> {

							deps.set( this.lookup( name.replace( /[._]/g , '/' ) ), priority )
							return str
						}
					)
				}
			)

			return deps
		}

	}

}
