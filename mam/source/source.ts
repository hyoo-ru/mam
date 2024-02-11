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

		lookup( path: string ): $mol_file {

			const dir = this.root().dir().resolve( path + '/' + path.replace( /.*\//, '' ) ) // dir duplicatation for the case when submodules should be independent from the parent 

			const lookup = ( dir: $mol_file ): $mol_file => {

				if( dir.exists() ) return dir
	
				const parent = dir.parent()
				if( parent === this.root().dir() ) {
					throw new Error( `Absent dependency: ${ dir.relate() }, (${ path })` )
				}

				return lookup( parent )
			}
			
			return lookup( dir )
		}

	}

}
