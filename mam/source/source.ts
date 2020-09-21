namespace $ {

	export let $mam_source_line = $mol_regexp.from([
		$mol_regexp.begin ,
		{ indent : $mol_regexp.repeat_greedy( '\t' , 1 ) },
	])

	/** Source file dependencies extractor. */
	export class $mam_source extends $mol_object2 {

		@ $mol_mem
		root() {
			return undefined as any as $mam_root
		}

		deps( source : $mol_file ) {
			return new Map< $mol_file , number >()
		}

		lookup( file : $mol_file ) : $mol_file {

			if( file.exists() ) return file

			const parent = file.parent()
			
			if( parent === this.root().dir() ) {
				throw new Error( `Absent dependency: ${ file.relate() }` )
			}
			
			return this.lookup( parent )
		}

	}

}
