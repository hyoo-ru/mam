namespace $ {

	$.$mol_file = $mam_file

	let $mam_start_root = null as null | $mam_root

	export function $mam_start() {

		if( !$mol_rpc_worker.is_main() ) {
			new $mol_wire_atom( '$mam_checker', ()=> $.$mol_one.$mam_checker.start() ).fresh()
			return
		}

		try {

			const args = process.argv.slice( 2 )

			if( args.every( arg => /^[^=]+=/.test( arg ) ) ) {
				$.$mam_server.serve()
				return
			}

			const root = $mam_start_root ??= new $.$mam_root

			for( const path of args ) {
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
