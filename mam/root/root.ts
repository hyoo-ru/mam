namespace $ {

	/** MAM Root of all sources. */
	export class $mam_root extends $mol_object2 {

		@ $mol_mem
		dir() {
			return this.$.$mol_file.relative( '.' )
		}

		@ $mol_mem_key
		pack( dir : $mol_file ) {
			const pack = new this.$.$mam_package
			pack.root = $mol_const( this )
			pack.dir = $mol_const( dir )
			return pack
		}

		@ $mol_mem_key
		source< Source extends typeof $mam_source >( Source : Source ) {
			const source = new Source
			source.root = $mol_const( this )
			return source as InstanceType< Source >
		}

		@ $mol_mem_key
		convert< Convert extends typeof $mam_convert >( Convert : Convert ) {
			const convert = new Convert
			convert.root = $mol_const( this )
			return convert as InstanceType< Convert >
		}

		@ $mol_mem_key
		bundle< Bundle extends typeof $mam_bundle >( Bundle : Bundle ) {
			const bundle = new Bundle
			bundle.root = $mol_const( this )
			return bundle as InstanceType< Bundle >
		}

		@ $mol_mem
		ts_options() {
			const rawOptions = JSON.parse( this.dir().resolve( 'tsconfig.json' ).text() + '').compilerOptions
			const res = $node.typescript.convertCompilerOptionsFromJson( rawOptions , "." , 'tsconfig.json' )
			if( res.errors.length ) throw res.errors
			return res.options
		}

	}

}
