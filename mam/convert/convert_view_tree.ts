namespace $ {

	export class $mam_convert_view_tree extends $mam_convert {

		@ $mol_mem_key
		generated( source : $mol_file ) {
			if( !/\.view\.tree$/.test( source.name() ) ) return []

			return [
				this.script( source ),
				this.locale( source ),
			]
		}

		@ $mol_mem_key
		promoted( source : $mol_file ) {
			return [ this.script( source ) ]
		}

		@ $mol_mem_key
		tree( source : $mol_file ) {
			const text = source.text()
			return this.$.$mol_tree2_from_string( text , source.path() )
		}

		@ $mol_mem_key
		compiled( source : $mol_file ) {
			return this.$.$mol_view_tree2_ts_compile( this.tree( source ) )
		}

		@ $mol_mem_key
		script( source : $mol_file ) {
			const script = source.parent().resolve( `-view.tree/${ source.name() }.ts` )
			script.text( this.compiled( source ).script )
			// const sourceMap = source.parent().resolve( `-view.tree/${ name }.map` )
			// sourceMap.text( res.map )

			return script
		}

		@ $mol_mem_key
		locale( source : $mol_file ) {
			const locale = source.parent().resolve( `-view.tree/${ source.name() }.locale=en.json` )
			locale.text( JSON.stringify( this.compiled( source ).locales , null , '\t' ) )
			
			return locale
		}
		
	}

}
