namespace $ {

	if( $mol_rpc_worker.is_main() ) {
	
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
				process.exit(0)
			}
			
		} catch( error ) {
			
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
