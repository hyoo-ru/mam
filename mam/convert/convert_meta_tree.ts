namespace $ {

	export class $mam_convert_meta_tree extends $mam_convert {

		static match( file: $mol_file ): boolean {
			return /\.meta\.tree$/.test( file.name() )
		}

		@ $mol_mem
		generated_sources() {
			const source = this.source()
			const tree = this.tree()
			
			let content = ''
			for( const step of tree.select( 'build', '' ).sub ) {

				const res = this.$.$mol_exec( source.parent().path(), step.value ).stdout.toString().trim()
				if( step.type ) content += `let ${ step.type } = ${ JSON.stringify( res ) }`

			}

			if( !content ) return []

			const script = source.parent().resolve( `-meta.tree/${ source.name() }.ts` )
			script.text( content )
			return [ script ]
		}

		@ $mol_mem
		tree() {
			const source = this.source()
			return this.root().source( [ this.$.$mam_source_meta_tree, source ] )!.tree()
		}

	}

}
