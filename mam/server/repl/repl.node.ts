namespace $ {

	type $mam_server_repl_host = {
		start( command: string ): void
		stop( command: string ): void
	}

	export class $mam_server_repl extends $mol_object2 {

		@ $mol_mem
		host() {
			return undefined as any as $mam_server_repl_host
		}

		hint() {
			return 'start: + path/to/module args\nstop:  - path/to/module args'
		}

		@ $mol_mem
		terminal() {

			// Без TTY (CI, docker, фон) EOF на stdin мгновенно убил бы сервер через 'close'
			if( !process.stdin.isTTY ) return null

			const terminal = $node.readline.createInterface({
				input: process.stdin,
				output: process.stdout,
				history: [],
				tabSize: 4,
				prompt: '',
			})
			terminal.prompt()

			terminal
				.on( 'line', line => this.execute( line ) )
				.on( 'SIGINT', ()=> process.exit( 0 ) )
				.on( 'close', ()=> process.exit( 0 ) )

			return terminal
		}

		execute( line: string ) {
			if( !line.trim() ) return

			const [ action, ... params ] = line.split( ' ' )
			const command = params.join( ' ' )

			switch( action ) {
				case '+': return this.host().start( command )
				case '-': return this.host().stop( command )
				case '?':
				default: return console.log( this.hint() )
			}
		}

		_auto() {
			this.terminal()
		}

	}

}
