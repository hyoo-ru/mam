namespace $ {

	export function $mam_file_patch() {

		const File_base = $mol_file_base as any
		const File_node = $mol_file_node as any
		const file_base_watcher = $mol_file_base.prototype.watcher

		File_base.reset_subtree = function( file: $mol_file_base ) {
			const sub = $mol_wire_probe( ()=> file.sub() ) ?? []
			file.reset()
			for( const child of sub ) this.reset_subtree( child )
		}

		File_base.changed_add = function( this: typeof $mol_file_base & any, type: 'change' | 'rename', path: string ) {
			if( /([\/\\]\.|___$)/.test( path ) ) return

			const file = this.relative( path.at(-1) === '/' ? path.slice(0, -1) : path )
			this.changed.add( file )

			if( !this.watching ) return

			this.frame?.destructor()
			this.frame = new this.$.$mol_after_timeout( this.watch_debounce(), ()=> {
				if( !this.watching ) return
				this.watching = false
				$mol_wire_async( this ).flush()
			} )
		}

		File_base.flush = function( this: typeof $mol_file_base & any ) {
			for( const file of this.changed ) {
				try {
					const base = $node.path.resolve( this.base || $node.process.cwd() ).replace( /\\/g, '/' )
					const inside_base = ( file: $mol_file_base )=> {
						const path = file.path()
						return path === base || path.startsWith( base + '/' )
					}
					for( let parent = file.parent(); ; parent = parent.parent() ) {
						if( $mol_wire_probe( ()=> parent.sub() ) ) parent.sub( null )
						if( parent === parent.parent() ) break
					}
					this.reset_subtree( file )
					if( file.type() === 'dir' && inside_base( file ) ) {
						;( file as any ).watcher()
						for( const child of file.sub() ) {
							if( child.type() === 'dir' && inside_base( child ) ) {
								;( child as any ).watcher()
							}
						}
					}
				} catch( error ) {
					if( $mol_fail_catch( error ) ) $mol_fail_log( error )
				}
			}

			this.changed.clear()
			this.watching = true
		}
		$mol_action( $mol_file_base, 'flush' )

		File_node.prototype.watcher = function( this: $mol_file_node, reset?: null ) {
			const watch_path = this.path()
			const root = ( this as any ).root()
			if( !root && !this.exists() ) return file_base_watcher.call( this )

			let watcher

			try {
				watcher = $node.fs.watch( watch_path )
			} catch( error: any ) {
				if( !( error instanceof Error ) ) error = new Error( 'Unknown watch error', { cause: error } )
				error.message += '\n' + watch_path

				if( root || error.code !== 'ENOENT' ) {
					this.$.$mol_fail_log( error )
				}

				return file_base_watcher.call( this )
			}

			let destructed = false

			watcher.on( 'change', ( type: 'change' | 'rename', name )=> {
				let event_path = name?.toString()
				if( event_path ) {
					event_path = event_path.replace( /^[\\\/]*\?[\\\/]/, '' )
					if( !$node.path.isAbsolute( event_path ) ) event_path = $node.path.join( watch_path, event_path )
					event_path = $node.path.resolve( event_path ).replace( /\\/g, '/' )
				} else {
					event_path = watch_path
				}

				;( this.constructor as typeof $mol_file_base & any ).changed_add( type, event_path )
				if( type === 'rename' && event_path === watch_path ) {
					destructed = true
					watcher.close()
					setTimeout( ()=> $mol_wire_async( this ).watcher( null ), 500 )
				}
			} )

			watcher.on( 'error', e => this.$.$mol_fail_log( e ) )

			watcher.on( 'close', ()=> {
				if( !destructed ) {
					;( this.constructor as typeof $mol_file_base & any ).changed_add( 'rename', watch_path )
					setTimeout( ()=> $mol_wire_async( this ).watcher( null ), 500 )
				}
			} )

			return {
				destructor() {
					destructed = true
					watcher.close()
				},
			}
		}
		$mol_mem( File_node.prototype, 'watcher' )

	}

}
