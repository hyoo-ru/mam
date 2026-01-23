namespace $ {
	const args = process.argv.slice(2)

	if (args.length > 0) {
		// CLI mode - build specified paths
		const root = new $mam_root()

		try {
			for (const path of args) {
				const pack = root.pack(root.dir().resolve(path))
				pack.bundles_generated()
			}

			process.exit(0)
		} catch (error) {
			if ($mol_promise_like(error)) $mol_fail_hidden(error)

			$mol_ambient({}).$mol_log3_fail({
				place: 'mam/start',
				message: (error as Error).stack ?? String(error),
			})

			process.exit(1)
		}
	} else {
		// Server mode - use $mam_server directly
		setTimeout(() => {
			try {
				const server = new $mam_server()
				server.start()
			} catch (error) {
				if ($mol_promise_like(error)) $mol_fail_hidden(error)
				$mol_fail_log(error)
			}
		})
	}
}
