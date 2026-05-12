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

		filter( file: $mol_file ) {
			return true
		}

		@ $mol_mem
		source_classes(): ( typeof $mam_source )[]  {
			return [
				this.$.$mam_source_dir,
				this.$.$mam_source_js,
				this.$.$mam_source_css,
				this.$.$mam_source_view_tree,
				this.$.$mam_source_view_ts,
				this.$.$mam_source_ts,
				this.$.$mam_source_meta_tree,
			]
		}

		@ $mol_mem
		convert_classes(): ( typeof $mam_convert )[]  {
			return [
				this.$.$mam_convert_meta_tree,
				this.$.$mam_convert_view_tree,
				this.$.$mam_convert_glsl,
				this.$.$mam_convert_css,
				this.$.$mam_convert_bin,
				this.$.$mam_convert_ts,
			]
		}

		@ $mol_mem
		bundle_classes(): ( typeof $mam_bundle )[] {
			return [
				this.$.$mam_bundle_meta,
				this.$.$mam_bundle_js,
				this.$.$mam_bundle_mjs,
				this.$.$mam_bundle_view_tree,
				this.$.$mam_bundle_meta_tree,
				this.$.$mam_bundle_locale,
				this.$.$mam_bundle_index_html,
				this.$.$mam_bundle_package_json,
				this.$.$mam_bundle_manifest_json,
				this.$.$mam_bundle_readme,
				this.$.$mam_bundle_files,
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

		@ $mol_mem_key
		runtime_js_files( file: $mol_file ) {
			if( /\.[j]sx?$/.test( file.name() ) ) return [ file ]

			const js = [] as $mol_file[]

			for( const convert of this.converts( file ) ) {
				if( !convert ) continue

				for( const gen of [ ...convert.generated_artifacts(), ...convert.generated_sources() ] ) {
					if( !this.filter( gen ) ) continue
					if( !/\.[j]sx?$/.test( gen.name() ) ) continue
					js.push( gen )
				}
			}

			return js
		}

		link_max(
			graph: $mol_graph< $mol_file, { priority: number } >,
			from: $mol_file,
			to: $mol_file,
			priority: number,
		) {
			const edge = graph.edge_out( from, to )
			if( !edge || edge.priority < priority ) {
				graph.link( from, to, { priority } )
			}
		}

		collect_convert_edges(
			graph: $mol_graph< $mol_file, { priority: number } >,
			file: $mol_file,
			collect: ( file: $mol_file )=> void,
		) {
			for (const convert of this.converts( file ) ) {
				if( !convert ) continue

				for( const gen of convert.generated_artifacts() ) {
					if( !this.filter( gen ) ) continue

					graph.link( file, gen, { priority: 0 } )
					graph.link( gen, file, { priority: 1 } )
				}

				for( const gen of convert.generated_sources() ) {
					if( !this.filter( gen ) ) continue
					
					graph.link( file, gen, { priority: 1 } )
					graph.link( gen, file, { priority: 0 } )

					collect( gen )
				}
			}
		}

		link_runtime_js_edges(
			graph: $mol_graph< $mol_file, { priority: number } >,
			file: $mol_file,
			dep: $mol_file,
			priority: number,
		) {
			for( const file_js of this.runtime_js_files( file ) ) {
				for( const dep_js of this.runtime_js_files( dep ) ) {
					if( file_js === dep_js ) continue
					this.link_max( graph, file_js, dep_js, priority )
				}
			}
		}

		collect_source_edges(
			graph: $mol_graph< $mol_file, { priority: number } >,
			file: $mol_file,
			collect: ( file: $mol_file )=> void,
		) {
			for( const source of this.sources( file ) ) {
				if( !source ) continue

				for( const[ dep, priority ] of source.deps() ) {
					if( !this.filter( dep ) ) continue

					this.link_max( graph, file, dep, priority )
					this.link_runtime_js_edges( graph, file, dep, priority )
					
					collect( dep )
				}
			}
		}

		@ $mol_mem
		graph() {
			
			const ignore = new Set<$mol_file>()
			const graph = new $mol_graph< $mol_file, { priority: number } >()
			
			const collect = ( file: $mol_file )=> {

				if( ignore.has( file ) ) return
				ignore.add( file )

				this.collect_convert_edges( graph, file, collect )
				this.collect_source_edges( graph, file, collect )

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
				... this.bundles().map( bundle => bundle.artifacts( this ) )
			)
		}

	}

}
