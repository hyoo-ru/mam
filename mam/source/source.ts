namespace $ {

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
			if( existed === undefined || existed < priority ) deps.set( dep, priority )
		}

		fqn_add( deps: Map< $mol_file, number >, fqn: string, priority: number ) {
			const dep = this.lookup( fqn.replace( /[._]/g, '/' ) )
			this.dep_add( deps, dep, priority )
		}

		path_resolve( path: string ) {
			if( $node_internal_check( path ) ) return null
			return path[0] === '.'
				? this.file().parent().resolve( path )
				: this.root().dir().resolve( path )
		}

		lookup( path: string ): $mol_file {

			const target = path + '/' + path.replace( /.*\//, '' )
			let dep = this.root().dir().resolve( target )

			while( !dep.exists() ) {
				if( this.root().pack( dep ).ensure() ) return dep

				const parent = dep.parent()
				if( parent.type() === 'dir' ) parent.sub()
				if( parent === this.root().dir() ) {
					throw new Error( `Absent dependency: ${ dep.relate() }, (${ path })` )
				}
				dep = parent
			}

			return dep
		}

	}

}
