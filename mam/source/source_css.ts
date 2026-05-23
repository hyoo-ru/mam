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

			const scan = ( source: string )=> {
				for( const line of source.split( '\n' ) ) {
					const priority = this.priority( line )

					for( const token of line.matchAll( $mam_source_refs_css ) ) {
						if( !token.groups ) continue

						const name = token.groups.name
						if( token.groups.attr ) {
							deps.set( this.lookup( name.replace( /[._-]/g , '/' ) ), priority )
						} else if( token.groups.fqn ) {
							deps.set( this.lookup( name.replace( /[._]/g , '/' ) ), priority )
						}
					}
				}
			}

			for( const token of String( this.file().text() ).matchAll( $mam_source_remarks_css ) ) {
				if( !token.groups ) scan( token[0] )
			}

			return deps
		}

	}

}
