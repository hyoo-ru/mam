namespace $ {

	$.$mol_file = $mam_file

	export function $mam_start() {

		try {

			const root = new $.$mam_root

			for( const path of process.argv.slice( 2 ) ) {
				root.pack( root.dir().resolve( path ) ).bundles_generated()
			}

			process.exit(0)

		} catch( error ) {

			if( $mol_promise_like( error ) ) $mol_fail_hidden( error )

			$mol_ambient({}).$mol_log3_fail({
				place: 'mam/start',
				message: ( error as Error ).stack ?? String( error ),
			})

			process.exit(1)

		}

	}

	setTimeout( ()=> $mol_wire_async( $ ).$mam_start() )

}
