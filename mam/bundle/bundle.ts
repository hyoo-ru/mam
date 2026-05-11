namespace $ {

	/** Makes one bundle from all required sources. */
	export class $mam_bundle extends $mol_object2 {
		
		@ $mol_mem
		root() {
			return undefined as any as $mam_root
		}
		
		/** Used when the generated bundles should be the same for any slice of pack */
		@ $mol_mem_key
		generated_for_pack( pack: $mam_package ) {
			return [] as $mol_file[]
		}

		/** Generated bundle by slice */
		@ $mol_mem_key
		generated( slice: $mam_slice ) {
			return this.generated_for_pack( slice.pack() )
		}

		log( target: $mol_file, duration: number ) {

			const path = target.relate( this.root().dir() )
			
			this.$.$mol_log3_done({
				place: this,
				duration: `${duration}ms`,
				message: `Built`, 
				path,
			})

		}

		js_files( files: $mol_file[], order = files ) {
			const root = this.root().dir()
			const pos = new Map( order.map( ( file, index )=> [ file.path(), index ] as const ) )
			const rank = ( file: $mol_file )=> {
				switch( file.relate( root ) ) {
					case 'mam.jam.js': return -2
					case 'mam.ts.js': return -1
					case 'mol/test/test.test.ts.js': return -1
				}
				return 0
			}
			const source_path = ( file: $mol_file )=> {
				if( /[\\\/]-[^\\\/]+[\\\/]/.test( file.path() ) ) {
					return file.parent().parent().resolve( file.name().replace( /\.js$/, '' ) ).path()
				}
				return file.path().replace( /\.([cm]?[jt]sx?)\.js$/, '.$1' )
			}
			
			return files
				.map( ( file, index )=> ({
					file,
					index,
					rank: rank( file ),
					order: pos.get( source_path( file ) ) ?? pos.get( file.path() ) ?? index,
				}) )
				.sort( ( left, right )=> ( left.rank - right.rank ) || ( left.order - right.order ) || ( left.index - right.index ) )
				.map( item => item.file )
		}
		
	}

}
