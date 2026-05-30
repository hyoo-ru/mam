namespace $ {

	$mam_file_patch()

	export class $mam_start_runner extends $mol_object2 {

		@ $mol_action
		run() {
			const root = new $mam_root

			try {

				const args = process.argv.slice( 2 )

				if( args.length === 0 || args.every( arg => /^[^=]+=/.test( arg ) ) ) {
					$.$mam_server.serve()
				} else {
					for( const path of args ) {

						const pack = root.pack( root.dir().resolve( path ) )
						pack.bundles_generated()

					}
					process.exit( 0 )
				}

			} catch( error ) {

				// Promise — sigil от wire-fiber'а: пробрасываем чтобы $mol_wire_async ретраил.
				// Иначе любая async-операция (RPC worker, dynamic import) ломает весь build
				// после первого же fiber-promise'а.
				if( $mol_promise_like( error ) ) $mol_fail_hidden( error )

				$mol_ambient({}).$mol_log3_fail({
					place: 'mam/start',
					message: ( error as Error ).stack ?? String( error ),
				})

				process.exit( 1 )

			}
		}

	}

	export function $mam_start() {

		if( $mol_rpc_worker.is_main() ) {
			setTimeout( ()=> $mol_wire_async( new $mam_start_runner ).run() )
		} else {
			new $mol_wire_atom( '$mam_checker', ()=> $.$mol_one.$mam_checker.start() ).fresh()
		}

	}

	setTimeout( ()=> $.$mam_start() )

}
