namespace $ {

	/** Collects sources by dependencies. */
	export class $mam_slice extends $mol_object2 {

		@ $mol_mem
		pack() {
			return undefined as any as $mam_package
		}

		root() {
			return this.pack().root()
		}
		
		prefix() {
			return 'index'
		}

		filter( file : $mol_file ) {
			if( !/^[a-z0-9]/i.test( file.name() ) ) return false
			return true
		}
		
		@ $mol_mem
		source_classes() {
			return [
				this.$.$mam_source_dir,
				this.$.$mam_source_js,
				this.$.$mam_source_ts,
			]
		}

		@ $mol_mem
		convert_classes() {
			return [
				this.$.$mam_convert_view_tree,
				this.$.$mam_convert_ts,
			]
		}

		@ $mol_mem
		bundle_classes() {
			return [
				this.$.$mam_bundle_meta,
				this.$.$mam_bundle_js,
				this.$.$mam_bundle_dts,
			]
		}

		@ $mol_mem
		sources() {
			return this.source_classes().map( ctor => this.root().source( ctor ) )
		}

		@ $mol_mem
		converts() {
			return this.convert_classes().map( ctor => this.root().convert( ctor ) )
		}

		@ $mol_mem
		bundles() {
			return this.bundle_classes().map( ctor => this.root().bundle( ctor ) )
		}

		@ $mol_mem
		graph() {
			
			const sources = this.sources()
			const converts = this.converts()
			
			const ignore = new Set<$mol_file>()
			const graph = new $mol_graph< $mol_file , { priority : number } >()
			
			const collect = ( file : $mol_file )=> {

				if( ignore.has( file ) ) return
				ignore.add( file )

				for (const convert of converts ) {

					for( const generated of convert.generated( file ) ) {

						if( !this.filter( generated ) ) continue
						
						graph.link( file , generated , { priority: convert.priority.generated } )
						graph.link( generated , file , { priority: convert.priority.source } )

						collect( generated )

					}
					
				}

				for( const source of sources ) {

					for( const[ dep , priority ] of source.deps( file ) ) {

						if( !this.filter( dep ) ) continue

						const edge = graph.edge_out( file , dep )
						if( !edge || edge.priority < priority ) {
							graph.link( file , dep , { priority } )
						}
						
						collect( dep )

					}
					
				}

			}

			collect( this.pack().dir() )
			
			graph.acyclic( edge => edge.priority )
			
			return graph
		}

		@ $mol_mem
		files() {
			return this.graph().sorted
		}

		@ $mol_mem
		bundles_generated() {
			return ( [] as $mol_file[] ).concat(
				... this.bundles().map( bundle => bundle.generated( this ) )
			)
		}

	}

}
