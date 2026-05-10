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

		js_files_ordered( files: $mol_file[], order = files, graph?: $mol_graph< $mol_file, { priority: number } > ) {
			const root = this.root().dir()
			const pos = new Map( order.map( ( file, index )=> [ file.path(), index ] as const ) )
			const file_by_path = new Map( order.map( file => [ file.path(), file ] as const ) )
			const graph_by_path = new Map( [ ... ( graph?.nodes ?? [] ) ].map( file => [ file.path(), file ] as const ) )
			const rank = ( file: $mol_file )=> {
				switch( file.relate( root ) ) {
					case 'mam.jam.js': return -2
					case 'mam.ts.js': return -1
					case 'mol/test/test.test.ts.js': return -1
				}
				return 0
			}
			const source_index = ( file: $mol_file )=> {
				const direct = pos.get( file.path() )
				const source = file.path().replace( /\.([cm]?[jt]sx?)\.js$/, '.$1' )
				const css_source = source.match( /^(.*)[\\\/]-css[\\\/]([^\\\/]+\.css)\.ts$/ )
				if( css_source ) {
					const original = this.$.$mol_file.absolute( css_source[1] ).resolve( css_source[2] )
					return pos.get( original.path() ) ?? direct ?? Number.MAX_SAFE_INTEGER
				}
				const view_tree_source = source.match( /^(.*)[\\\/]-view\.tree[\\\/]([^\\\/]+\.view\.tree)\.ts$/ )
				if( view_tree_source ) {
					const original = this.$.$mol_file.absolute( view_tree_source[1] ).resolve( view_tree_source[2] )
					return pos.get( original.path() ) ?? direct ?? Number.MAX_SAFE_INTEGER
				}
				const source_file = file_by_path.get( source ) ?? this.$.$mol_file.absolute( source )
				const primary_dir = source_file.parent()
				if( source_file.name() === `${ primary_dir.name() }.ts` ) {
					const source_pos = pos.get( source )
					const graph_source = [ ... ( graph?.nodes ?? [] ) ].find( node => node.path() === source_file.path() ) ?? source_file
					const graph_dir = [ ... ( graph?.nodes ?? [] ) ].find( node => node.path() === primary_dir.path() ) ?? primary_dir
					const deps = graph?.edges_out.get( graph_source )
					const inputs = graph?.edges_in.get( graph_dir )
					const used = [ ... ( inputs?.keys() ?? [] ) ].some( input => input.path() !== source_file.path() )
					if( used ) {
						const deps_pos = [ ... ( deps?.keys() ?? [] ) ]
							.map( dep => pos.get( dep.path() ) )
							.filter( ( index ): index is number => index !== undefined && ( source_pos === undefined || index < source_pos ) )
						return Math.max(
							pos.get( primary_dir.path() ) ?? 0,
							... deps_pos,
						)
					}
				}
				return pos.get( source ) ?? direct ?? Number.MAX_SAFE_INTEGER
			}
			const ordered = files
				.map( ( file, index )=> ({ file, index, rank: rank( file ), source_index: source_index( file ) }) )
				.sort( ( left, right )=> ( left.rank - right.rank ) || ( left.source_index - right.source_index ) || ( left.index - right.index ) )
				.map( item => item.file )

			const files_by_path = new Map( ordered.map( file => [ file.path(), file ] as const ) )
			const source_by_js = new Map(
				ordered.map( file => [
					file,
					file_by_path.get( file.path().replace( /\.([cm]?[jt]sx?)\.js$/, '.$1' ) )
				] as const )
			)
			const js_by_source = new Map(
				[ ... source_by_js ].flatMap( ([ js, source ])=> source ? [[ source.path(), js ] as const] : [] )
			)
			const js_by_dir = ( dir: $mol_file )=> {
				const base = dir.name()
				return files_by_path.get( dir.resolve( `${ base }.ts.js` ).path() )
					?? files_by_path.get( dir.resolve( `${ base }.tsx.js` ).path() )
					?? files_by_path.get( dir.resolve( `${ base }.web.ts.js` ).path() )
					?? files_by_path.get( dir.resolve( `${ base }.web.tsx.js` ).path() )
					?? files_by_path.get( dir.resolve( `${ base }.view.ts.js` ).path() )
					?? files_by_path.get( dir.resolve( `${ base }.view.tsx.js` ).path() )
					?? files_by_path.get( dir.resolve( `${ base }.view.tree.ts.js` ).path() )
					?? files_by_path.get( dir.resolve( `${ base }.view.css.ts.js` ).path() )
			}
			const js_by_dep = ( dep: $mol_file )=> {
				return js_by_source.get( dep.path() )
					?? ( /\.tsx?$/.test( dep.name() ) ? files_by_path.get( dep.path() + '.js' ) : undefined )
					?? js_by_dir( dep )
			}

			const deps_by_file = new Map< $mol_file, Set< $mol_file > >()
			for( const file of ordered ) {
				const source = source_by_js.get( file )
				if( !source ) continue
				const deps = graph?.edges_out.get( graph_by_path.get( source.path() ) ?? source )
				if( !deps ) continue
				const view_tree_generated = /[\\\/]-view\.tree[\\\/]/.test( file.path() )
				for( const [ dep, edge ] of deps ) {
					if( edge.priority < 0 && !view_tree_generated ) continue
					const dep_js = js_by_dep( dep )
					if( !dep_js || dep_js === file ) continue
					let list = deps_by_file.get( file )
					if( !list ) deps_by_file.set( file, list = new Set )
					list.add( dep_js )
				}
			}

			const result = [] as $mol_file[]
			const status = new Map< $mol_file, 'seen' | 'done' >()
			const visit = ( file: $mol_file )=> {
				const state = status.get( file )
				if( state === 'done' ) return
				if( state === 'seen' ) return
				status.set( file, 'seen' )
				for( const dep of deps_by_file.get( file ) ?? [] ) visit( dep )
				status.set( file, 'done' )
				result.push( file )
			}
			for( const file of ordered ) visit( file )

			return result
		}
		
	}

}
