namespace $ {

	$.$mol_file = $mam_file

	let $mam_start_root = null as null | $mam_root

	export function $mam_start() {

		if( $mol_rpc_worker.is_main() ) {

			try {

				const args = process.argv.slice( 2 )

				if( args.length === 0 || args.every( arg => /^[^=]+=/.test( arg ) ) ) {
					$.$mam_server.serve()
				} else {

					// Один root на все перезапуски задачи после suspend, иначе плодятся worker-треды чекера.
					// Класс берётся из контекста — кастомный сборщик подменяет его через $.$mam_root
					const root = $mam_start_root ??= new $.$mam_root

					for( const path of args ) {

						const pack = root.pack( root.dir().resolve( path ) )

						pack.bundles_generated()

					}
					process.exit(0)
				}

			} catch( error ) {

				if( $mol_promise_like( error ) ) $mol_fail_hidden( error )

				$mol_ambient({}).$mol_log3_fail({
					place: 'mam/start',
					message: ( error as Error ).stack ?? String( error ),
					// message: error?.message ?? String( error ),
				})

				process.exit(1)

			}

		} else {
			new $mol_wire_atom( '$mam_checker', ()=> $.$mol_one.$mam_checker.start() ).fresh()
		}

	}

	setTimeout( ()=> $mol_wire_async( $ ).$mam_start() )

}
