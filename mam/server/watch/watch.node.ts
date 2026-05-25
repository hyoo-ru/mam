namespace $ {

	type $mam_server_watch_rebuild_task = {
		changed: Set< string >
		timer: $mol_after_timeout | null
		running: boolean
	}

	type $mam_server_watch_host = {
		pack( path: string ): $mam_package
		web_js_artifacts( path: string ): $mol_file[]
		bundle_artifacts< Bundle extends typeof $mam_bundle >( Bundle: Bundle, slice: $mam_slice ): $mol_file[]
	}

	export class $mam_server_watch extends $mol_object2 {

		@ $mol_mem
		host() {
			return undefined as any as $mam_server_watch_host
		}

		@ $mol_mem
		clients( next = new Map< $mol_rest_port, string >() ) {
			return next
		}

		protected watch_versions = new Map< string, Map< string, unknown > >()
		protected rebuild_tasks = new Map< string, $mam_server_watch_rebuild_task >()

		open( port: $mol_rest_port, path: string ) {
			this.clients( new Map([ ... this.clients(), [ port, path ] ]) )
			this.watch_sync( path )

			this.$.$mol_log3_rise({
				place: this.host(),
				message: 'Connect',
				path,
			})
		}

		close( port: $mol_rest_port ) {
			const path = this.clients().get( port )
			const clients = new Map( this.clients() )
			clients.delete( port )
			this.clients( clients )
			if( path && ![ ... clients.values() ].includes( path ) ) this.drop( path )

			this.$.$mol_log3_rise({
				place: this.host(),
				message: 'Disconnect',
				path,
			})
		}

		protected drop( path: string ) {
			this.watch_versions.delete( path )

			const task = this.rebuild_tasks.get( path )
			task?.timer?.destructor()
			this.rebuild_tasks.delete( path )
		}

		@ $mol_mem_key
		protected watch_files( path: string ) {
			const pack = this.host().pack( path )
			const files = new Set< $mol_file >
			const skip = ( file: $mol_file )=> {
				if( /(?:^|[\\\/])-(?:[\\\/]|$)/.test( file.path() ) ) return true
				if( /[\\\/]-[^\\\/]*(?:[\\\/]|$)/.test( file.path() ) ) return true
				return false
			}
			for( const slice of pack.slices() ) {
				for( const file of slice.graph().sorted ) {
					if( skip( file ) ) continue
					files.add( file )
				}
			}

			const versions = new Map< string, unknown >
			const version = ( file: $mol_file )=> {
				if( file.type() !== 'dir' ) return file.version()
				file.watcher()
				return [
					file.version(),
					... file.sub().map( child => `${ child.name() }:${ child.type() }` ),
				].join( '\n' )
			}
			for( const file of files ) {
				versions.set( file.path(), version( file ) )
			}
			return versions
		}

		watch_sync( path: string ) {
			const versions = this.watch_files( path )
			this.watch_versions.set( path, versions )
			return true
		}

		@ $mol_mem_key
		watch( path: string ) {
			const versions = this.watch_files( path )

			const prev = this.watch_versions.get( path )
			this.watch_versions.set( path, versions )

			if( !prev ) return true

			const changed = [] as string[]
			for( const [ file, version ] of versions ) {
				if( prev.get( file ) === version ) continue
				changed.push( file )
			}
			for( const file of prev.keys() ) {
				if( versions.has( file ) ) continue
				changed.push( file )
			}
			if( !changed.length ) return true

			this.rebuild_schedule( path, changed )
			return true
		}

		rebuild_schedule( path: string, changed: readonly string[] ) {
			let task = this.rebuild_tasks.get( path )
			if( !task ) {
				task = {
					changed: new Set,
					timer: null,
					running: false,
				}
				this.rebuild_tasks.set( path, task )
			}

			for( const file of changed ) task.changed.add( file )
			if( task.timer || task.running ) return

			task.timer = new this.$.$mol_after_timeout( 50, ()=> {
				task!.timer = null
				this.rebuild_start( path, task! )
			} )
		}

		protected rebuild_start( path: string, task: $mam_server_watch_rebuild_task ) {
			if( this.rebuild_tasks.get( path ) !== task || task.running ) return

			const changed = [ ... task.changed ]
			task.changed.clear()
			task.running = true
			this.rebuild( path, task, changed )
		}

		protected rebuild( path: string, task: $mam_server_watch_rebuild_task, changed: readonly string[] ) {
			if( this.rebuild_tasks.get( path ) !== task ) return

			try {
				this.host().web_js_artifacts( path )
				if( changed.some( file => /\.locale=[^/]+\.json$/.test( file ) ) ) {
					const pack = this.host().pack( path )
					this.host().bundle_artifacts(
						this.$.$mam_bundle_locale,
						pack.slice( this.$.$mam_slice_web_prod ),
					)
				}
				this.watch_sync( path )
			} catch( error: any ) {
				if( $mol_promise_like( error ) ) {
					Promise.resolve( error ).then(
						()=> this.rebuild( path, task, changed ),
						()=> this.rebuild( path, task, changed ),
					)
					return
				}
				this.$.$mol_log3_fail({
					place: `${this}.rebuild()`,
					message: error.message ?? String( error ),
					stack: error.stack,
					path,
				})
			}

			if( this.rebuild_tasks.get( path ) !== task ) return
			task.running = false

			this.$.$mol_log3_rise({
				place: this.host(),
				message: '$mam_obsolete',
				path,
				changed: changed.slice( 0, 10 ),
			})

			for( const [ port, client_path ] of this.clients() ) {
				if( client_path !== path ) continue
				port.send_text( '$mam_obsolete' )
			}

			if( task.changed.size ) {
				this.rebuild_start( path, task )
			} else {
				this.rebuild_tasks.delete( path )
			}
		}

		_auto() {
			for( const path of new Set( this.clients().values() ) ) {
				this.watch( path )
			}
		}

	}

}
