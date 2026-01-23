namespace $ {

	export class $mam_convert_bin extends $mam_convert {

		static match( file: $mol_file ): boolean {

			const name = file.name()

			for( const type of Object.keys( this.types ) ) {
				if( new RegExp( `\.${ type }$` ).test( name ) ) return true
			}

			return false
		}

		static types = {
			'svg': 'image/svg+xml',
			'png': 'image/png',
			'jpg': 'image/jpeg',
			'jpeg': 'image/jpeg',
			'gif': 'image/gif',
			'webp': 'image/webp',
			'bin': 'application/octet-stream',
		}
		
		@ $mol_mem
		generated() {
			const source = this.source()

			const script = source.parent().resolve( `-bin/${ source.name() }.js` )
			const payload = $mol_base64_encode( source.buffer() )

			const types = this.$.$mam_convert_bin.types
			const ext = source.ext().replace( /^.*\./, '' ) as keyof typeof types 
			const uri = `data:${ types[ext] };base64,${ payload }`

			const path = source.relate( this.root().dir() )
			script.text( `var $node = $node || {} ; $node[ ${ JSON.stringify( '/' + path ) } ] = ${ JSON.stringify( uri ) }\n` )
			
			return [ script ]
		}

	}

}
