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

		source_classes() {
			return this.root().source_classes()
		}

		convert_classes() {
			return this.root().convert_classes()
		}

		bundle_classes() {
			return this.root().bundle_classes()
		}

		@ $mol_mem_key
		sources( file: $mol_file ) {
			return this.source_classes().flatMap( ctor => this.root().source([ ctor, file ]) ?? [] )
		}

		@ $mol_mem_key
		converts( file: $mol_file ) {
			return this.convert_classes().flatMap( ctor => this.root().convert([ ctor, file ]) ?? [] )
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

		@ $mol_mem_key
		file_deps( file: $mol_file ) {
			const deps = [] as [ $mol_file, number ][]

			for( const source of this.sources( file ) ) {
				for( const[ dep, priority ] of source.deps() ) {
					if( !this.filter( dep ) ) continue
					if( dep.path() === file.path() ) continue
					deps.push([ dep, priority ])
				}
			}

			if( file.type() === 'file' ) {
				for( const gen of this.file_generated_sources( file ) ) {
					deps.push([ gen, 1 ])
				}
			}

			return deps
		}

		file_generated_sources( file: $mol_file ) {
			return this.converts( file ).flatMap( convert => convert.generated_sources()
				.filter( gen => this.filter( gen ) ) )
		}

		file_generated_artifacts( file: $mol_file ) {
			return this.converts( file ).flatMap( convert => convert.generated_artifacts()
				.filter( gen => this.filter( gen ) ) )
		}

		@ $mol_mem
		graph() {
			
			const ignore = new Set<$mol_file>()
			const graph = new $mol_graph< $mol_file, { priority: number } >()

			const collect = ( file: $mol_file ): void => {

				if( ignore.has( file ) ) return
				ignore.add( file )

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

			const add = ( file: $mol_file )=> {
				if( file.type() !== 'file' ) return
				files.add( file )

				if( /\.d\.ts$/.test( file.name() ) ) return
				if( !file.exists() ) return

				for( const gen of this.file_generated_artifacts( file ) ) {
					files.add( gen )
				}
			}

			for( const file of this.graph().sorted ) add( file )

			return files
		}

		/** Все исходники слайса, на которые срабатывает данный лоадер. */
		@ $mol_mem_key
		files_of< Source extends typeof $mam_source >( Source: Source ) {
			return [ ...this.files() ].filter( file => Source.match( file ) )
		}

		@ $mol_mem
		bundles_generated() {
			return this.bundles().flatMap( bundle => bundle.artifacts( this ) )
		}

	}

}
