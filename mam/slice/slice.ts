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

		direct_files( dir: $mol_file ) {
			return dir.sub().filter( item => {
				if( item.type() !== 'file' ) return false
				if( !/^[a-z0-9]/i.test( item.name() ) ) return false
				return this.filter( item )
			} )
		}

		@ $mol_mem
		graph() {
			
			const ignore = new Set<$mol_file>()
			const graph = new $mol_graph< $mol_file, { priority: number } >()

			const collect_dir = ( dir: $mol_file )=> {

				if( dir !== this.root().dir() ) collect( dir.parent() )
				const main = new Map< string, $mol_file >()

				for( const item of this.direct_files( dir ) ) {
					collect( item )

					const main_name = item.name().replace( /\.(?:web|node)\./, '.' )
					const main_file = main.get( main_name )
					if( main_file ) this.link_max( graph, item, main_file, 10 )
					else main.set( item.name(), item )
				}

			}

			const collect_file = ( file: $mol_file )=> {

				if( !file.exists() ) return

				for( const source of this.sources( file ) ) {
					if( !source ) continue

					for( const[ dep, priority ] of source.deps() ) {
						if( !this.filter( dep ) ) continue
						
						const owner = file.parent().name()[0] === '-'
							? file.parent().parent()
							: file.parent()
						if( dep === owner ) continue

						collect( dep )
						const entries = dep.type() === 'dir' ? this.direct_files( dep ) : [ dep ]
						for( const entry of entries ) {
							if( entry === file ) continue
							collect( entry )
							this.link_max( graph, file, entry, priority )
						}
					}
				}

				for( const convert of this.converts( file ) ) {
					if( !convert ) continue

					for( const gen of convert.generated_sources() ) {
						if( !this.filter( gen ) ) continue
						collect( gen )
						this.link_max( graph, file, gen, 1 )
					}
				}

			}
			
			const collect = ( file: $mol_file )=> {

				if( ignore.has( file ) ) return
				ignore.add( file )

				graph.nodes.add( file )

				if( file.type() === 'dir' ) {
					collect_dir( file )
					return
				}

				collect_file( file )

			}

			collect( this.pack().dir() )
			
			graph.acyclic( edge => edge.priority )
			
			return graph
		}

		output_files( file: $mol_file ) {
			const files = [ file ]
			if( /\.d\.ts$/.test( file.name() ) ) return files
			if( !file.exists() ) return files

			for( const convert of this.converts( file ) ) {
				if( !convert ) continue

				for( const gen of convert.generated_artifacts() ) {
					if( !this.filter( gen ) ) continue
					files.push( gen )
				}

				for( const gen of convert.generated_sources() ) {
					if( !this.filter( gen ) ) continue
					files.push( gen )
				}
			}

			return files
		}

		@ $mol_mem
		files() {
			const files = new Set< $mol_file >()

			for( const file of this.graph().sorted ) {
				if( file.type() !== 'file' ) continue
				for( const output of this.output_files( file ) ) files.add( output )
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
