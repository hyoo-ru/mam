// @ts-check

class $mam_server_client {

	static closed = false
	static reloading = false

	static run() {
		const origin = document.location.origin.replace( /^http/, 'ws' )
		const socket = new WebSocket( origin + document.location.pathname, 'mam_reload' )

		socket.onclose = ()=> {
			if( this.reloading ) return
			this.closed = true
			setTimeout( ()=> this.run(), 1000 )
		}

		socket.onopen = ()=> {
			if( this.closed && !this.reloading ) location.reload()
			this.closed = false
		}

		socket.onmessage = event => {
			if( event.data !== '$mam_obsolete' ) return
			this.reloading = true
			location.reload()
		}
	}

}

$mam_server_client.run()
