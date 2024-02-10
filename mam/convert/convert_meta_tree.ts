namespace $ {

	export class $mam_convert_meta_tree extends $mam_convert {

		@ $mol_mem_key
		generated( source : $mol_file ) {
			if( source.ext() !== 'meta.tree' ) return []
			
			const tree = this.tree( source )
			
			let content = ''
			for( const step of tree.select( 'build' , '' ).sub ) {

				const res = this.$.$mol_exec( source.parent().path() , step.value ).stdout.toString().trim()
				if( step.type ) content += `let ${ step.type } = ${ JSON.stringify( res ) }`

			}

			if( !content ) return []

			const script = source.parent().resolve( `-meta.tree/${ source.name() }.ts` )
			script.text( content )
			return [ script ]
		}

		@ $mol_mem_key
		tree( source : $mol_file ) {
			return this.root().source( [ this.$.$mam_source_meta_tree, source ] )!.tree()
		}

	}

}
