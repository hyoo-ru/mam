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

		module_files( dir: $mol_file ) {
			return dir.sub().filter( item => {
				if( item.type() !== 'file' ) return false
				if( !/^[a-z0-9]/i.test( item.name() ) ) return false
				return this.filter( item )
			} )
			// .sort( ( left, right )=>
			// 	left.name().length - right.name().length
			// 	|| left.name().localeCompare( right.name() )
			// )
		}

		module_dir( file: $mol_file ) {
			return file.parent().name()[0] === '-'
				? file.parent().parent()
				: file.parent()
		}

		@ $mol_mem_key
		file_deps( file: $mol_file ) {
			const deps = [] as [ $mol_file, number ][]

			for( const source of this.sources( file ) ) {
				if( !source ) continue

				for( const[ dep, priority ] of source.deps() ) {
					if( !this.filter( dep ) ) continue

					if( dep.type() === 'file' ) {
						deps.push([ dep, priority ])
						continue
					}

					// Self module deps only name the current module declaration.
					if( dep.path() === this.module_dir( file ).path() ) continue

					// Directory deps expand to module files so variants can depend on base files.
					for( const dep_file of this.module_files( dep ) ) {
						if( dep_file.path() === file.path() ) continue
						deps.push([ dep_file, priority ])
					}
				}
			}

			for( const gen of this.file_generated_sources( file ) ) {
				deps.push([ gen, 1 ])
			}

			return deps
		}

		file_generated_sources( file: $mol_file ) {
			return this.converts( file ).flatMap( convert => {
				if( !convert ) return []
				return convert.generated_sources().filter( gen => this.filter( gen ) )
			} )
		}

		file_generated_artifacts( file: $mol_file ) {
			return this.converts( file ).flatMap( convert => {
				if( !convert ) return []
				return convert.generated_artifacts().filter( gen => this.filter( gen ) )
			} )
		}

		@ $mol_mem
		graph() {
			
			const ignore = new Set<$mol_file>()
			const graph = new $mol_graph< $mol_file, { priority: number } >()

			const collect = ( file: $mol_file ): void => {

				if( ignore.has( file ) ) return
				ignore.add( file )

				if( file.type() === 'dir' ) {
					if( file !== this.root().dir() ) collect( file.parent() )
					this.module_files( file ).forEach( collect )
					return
				}

				graph.nodes.add( file )

				for( const[ dep, priority ] of this.file_deps( file ) ) {
					collect( dep )
					this.link_max( graph, file, dep, priority )
				}

			}

			collect( this.pack().dir() )
			
			graph.acyclic( edge => edge.priority )
			
			return graph
		}

		@ $mol_mem
		files() {
			const files = new Set< $mol_file >()

			for( const file of this.graph().sorted ) {
				if( file.type() !== 'file' ) continue
				files.add( file )

				if( /\.d\.ts$/.test( file.name() ) ) continue
				if( !file.exists() ) continue

				for( const gen of this.file_generated_artifacts( file ) ) {
					files.add( gen )
				}
			}

			return files
		}

		@ $mol_mem
		bundles_generated() {
			return ( [] as $mol_file[] ).concat(
				... this.bundles().map( bundle => bundle.artifacts( this ) )
			)
		}

	}

}
