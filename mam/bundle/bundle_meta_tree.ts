namespace $ {

	export class $mam_bundle_meta_tree extends $mam_bundle {

		@ $mol_mem_key
		generated( slice: $mam_slice ) {

			const prefix = slice.prefix()
			const root = this.root()

			const start = Date.now()
			
			const target = slice.pack().output().resolve( `${prefix}.meta.tree` )
			
			const files = slice.graph().sorted
			
			const named_metas: $mol_tree[] = []
			files.forEach( file => {
				if( file.type() !== 'dir' ) return
				const meta = root.pack( file ).meta()
				if( meta.sub.length > 0 ) {
					named_metas.push( meta.clone({ value: '/' + file }) )
				}
			} )
			
			if( named_metas.length === 0 ) return []
			
			target.text( new $mol_tree( { sub: named_metas } ).toString() )
			
			this.log( target , Date.now() - start )
			
			return [ target ]
		}

	}
	
}
