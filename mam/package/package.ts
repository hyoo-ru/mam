namespace $ {

	/** Building MAM package */
	export class $mam_package extends $mol_object2 {

		@ $mol_mem
		root() {
			return undefined as any as $mam_root
		}

		@ $mol_mem
		dir() {
			return undefined as any as $mol_file
		}

		@ $mol_mem
		output( next? : $mol_file ) {
			return this.dir().resolve( '-' )
		}

		@ $mol_mem_key
		slice< Slice extends typeof $mam_slice >( Slice : Slice ) {
			const slice = new Slice
			slice.pack = $mol_const( this )
			return slice
		}

		@ $mol_mem
		slices() {
			return [
				this.slice( this.$.$mam_slice_web_prod ) ,
				// this.slice( this.$.$mam_slice_web_test ) ,
				// this.slice( this.$.$mam_slice_node_prod ) ,
				// this.slice( this.$.$mam_slice_node_test ) ,
			]
		}

		@ $mol_mem_key
		bundle< Bundle extends typeof $mam_bundle >( Bundle : Bundle ) {
			const bundle = new Bundle
			bundle.pack = $mol_const( this )
			return bundle as InstanceType< Bundle >
		}

		@ $mol_mem
		bundles_generated() {
			const files = new Set< $mol_file >()

			for (const slice of this.slices()) {
				for (const file of slice.bundles_generated()) {
					files.add( file )
				}
			}

			return files
		}

	}

}
