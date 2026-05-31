namespace $ {

	export class $mam_source_openapi extends $mam_source {

		static match( file: $mol_file ): boolean {
			return /\.openapi\.(yaml|yml|json)$/.test( file.name() )
		}

	}

}
