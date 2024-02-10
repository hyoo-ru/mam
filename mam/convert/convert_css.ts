namespace $ {

	export class $mam_convert_css extends $mam_convert {

		static match( file: $mol_file ): boolean {
			return /css?$/.test( file.ext() )
		}

		generated() {
			const source = this.source()

			const name = source.name()
			const script = source.parent().resolve( `-css/${ name }.ts` )
			
			const id = source.relate( this.root().dir() )
			const styles = source.text()
			const code = 'namespace $ { $'+`mol_style_attach( ${ JSON.stringify( id ) },\n ${ JSON.stringify( styles ) }\n) }`
			script.text( code )
			
			return [ script ]
		}

	}

}
