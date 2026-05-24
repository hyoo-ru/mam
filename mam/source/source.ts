namespace $ {

	export let $mam_source_line = $mol_regexp.from([
		$mol_regexp.begin,
		{ indent: $mol_regexp.repeat_greedy( '\t', 1 ) },
	])

	/** Source file dependencies extractor. */
	export class $mam_source extends $mol_object2 {

		static match( file: $mol_file ): boolean {
			return false
		}

		@ $mol_mem
		root() {
			return undefined as any as $mam_root
		}

		@ $mol_mem
		file() {
			return undefined as any as $mol_file
		}

		@ $mol_mem
		deps() {
			return new Map< $mol_file, number >()
		}

		priority( line: string ) {
			const indent = /^([\s\t]*)/.exec( line )!
			return - indent[ 0 ].replace( /\t/g, '    ' ).length / 4
		}

		dep_add( deps: Map< $mol_file, number >, dep: $mol_file, priority: number ) {
			const existed = deps.get( dep )
			if( !existed || existed < priority ) deps.set( dep, priority )
		}

		main_file( dir: $mol_file ) {
			for( const name of [
				dir.name() + '.view.tree',
				dir.name() + '.ts',
				dir.name() + '.tsx',
				dir.name() + '.js',
			] ) {
				const file = dir.resolve( name )
				if( file.exists() ) return file
			}
			return null
		}

		fqn_add( deps: Map< $mol_file, number >, fqn: string, priority: number ) {
			const dep = this.lookup( fqn.replace( /[._]/g, '/' ) )
			this.dep_add( deps, dep, priority )

			if( dep.type() !== 'file' ) return

			const owner = dep.parent()
			if( this.main_file( owner )?.path() === dep.path() ) {
				this.dep_add( deps, owner, priority )
			}
		}

		lookup( path: string ): $mol_file {

			const target = path + '/' + path.replace( /.*\//, '' )
			let dep = this.root().dir().resolve( target )

			while( !dep.exists() ) {
				if( this.root().pack( dep ).ensure() ) return dep

				const parent = dep.parent()
				if( parent === this.root().dir() ) {
					throw new Error( `Absent dependency: ${ dep.relate() }, (${ path })` )
				}
				dep = parent
			}

			const relate = dep.relate( this.root().dir() )
			if( dep.type() === 'dir' && relate !== path && relate !== target ) {
				return this.main_file( dep ) ?? dep
			}

			return dep
		}

	}

}
