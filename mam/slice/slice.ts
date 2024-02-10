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
		source_classes(): ( typeof $mam_source )[]  {
			return [
				this.$.$mam_source_dir,
				this.$.$mam_source_js,
				this.$.$mam_source_ts,
				this.$.$mam_source_meta_tree,
			]
		}

		@ $mol_mem
		convert_classes(): ( typeof $mam_convert )[]  {
			return [
				this.$.$mam_convert_meta_tree,
				this.$.$mam_convert_view_tree,
				this.$.$mam_convert_ts,
			]
		}

		@ $mol_mem
		bundle_classes(): ( typeof $mam_bundle )[] {
			return [
				this.$.$mam_bundle_meta,
				this.$.$mam_bundle_js,
				this.$.$mam_bundle_dts,
				this.$.$mam_bundle_index_html,
				this.$.$mam_bundle_test_html,
				this.$.$mam_bundle_readme,
				this.$.$mam_bundle_audit_js,
			]
		}

		@ $mol_mem_key
		sources( file: $mol_file ) {
			return this.source_classes().map( ctor => this.root().source([ ctor, file ]) )
		}

		@ $mol_mem_key
		converts( file: $mol_file ) {
			return this.convert_classes().map( ctor => this.root().convert([ ctor, file ]) )
		}

		@ $mol_mem
		bundles() {
			return this.bundle_classes().map( ctor => this.root().bundle( ctor ) )
		}

		@ $mol_mem
		graph() {
			
			const ignore = new Set<$mol_file>()
			const graph = new $mol_graph< $mol_file , { priority : number } >()
			
			const collect = ( file : $mol_file )=> {

				if( ignore.has( file ) ) return
				ignore.add( file )

				for (const convert of this.converts( file ) ) {
					if( !convert ) continue

					for( const gen of convert.generated() ) {
						if( !this.filter( gen ) ) continue

						graph.link( file , gen , { priority: 0 } )
						graph.link( gen , file , { priority: 1 } )
					}

					for( const gen of convert.generated_sources() ) {
						if( !this.filter( gen ) ) continue
						
						graph.link( file , gen , { priority: 1 } )
						graph.link( gen , file , { priority: 0 } )

						collect( gen )
					}
					
				}

				for( const source of this.sources( file ) ) {
					if( !source ) continue

					for( const[ dep , priority ] of source.deps() ) {
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
