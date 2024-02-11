namespace $ {

	export class $mam_source_css extends $mam_source {

		static match( file: $mol_file ): boolean {
			return /\.css?$/.test( file.name() )
		}

		@ $mol_mem
		deps() {
			const deps = super.deps()
			deps.set( this.lookup( 'mol_style_attach' ) , 0 )

			for( const code of this.file().text().matchAll( this.$.$mam_source_remarks_js ) ) {

				for( const line of code[0].split( '\n' ) ) {
					const refs = line.matchAll( this.$.$mam_source_refs_js )

					for( const { groups } of refs ) {
						const indent = line.matchAll( this.$.$mam_source_line )?.next().value?.indent ?? ''

						if( groups?.fqn ) {
							deps.set( this.lookup( groups.name.replace( /[._]/g , '/' ) ) , - indent.length )
						}
					}
				}
			}

			return deps
		}

	}

}
