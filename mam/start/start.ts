namespace $ {

	const root = new $mam_root

	try {
		
		for( const path of process.argv.slice( 2 ) ) {

			const pack = root.pack( root.dir().resolve( path ) )
			
			pack.bundles_generated()

		}

		process.exit(0)
		
	} catch( error ) {
		
		$mol_ambient({}).$mol_log3_fail({
			place: 'mam/start', 
			message: ( error as Error ).stack ?? String( error ),
			// message: error?.message ?? String( error ),
		})

		process.exit(1)
		
	}

}
