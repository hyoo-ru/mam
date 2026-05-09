namespace $ {

	export type $mam_checker_changes = {
		writes: [ path: string, data: string ][]
		errors: [ path: string, error: string ][]
	}

	export class $mam_checker extends $mol_object2 {

		paths() {
			return [] as readonly string[]
		}

		root_path() {
			return ''
		}

		options() {
			return $node.typescript.getDefaultCompilerOptions()
		}

		protected run() {}

		protected versions = {} as Record< string, number >
		protected watchers = new Map< string, ( path: string, kind: number )=> void >()
		protected writes = [] as [ path: string, data: string ][]
		protected errors = [] as [ path: string, error: string ][]

		protected write_add( path: string, data: string ) {
			this.writes.push([ path, data ])
		}

		protected error_add( path: string, error: string ) {
			this.errors.push([ path, error ])
		}

		protected changes_cut(): $mam_checker_changes | null {
			const writes = this.writes
			const errors = this.errors

			if( !writes.length && !errors.length ) return null

			this.writes = []
			this.errors = []

			return { writes, errors }
		}

		@ $mol_action
		protected recheck_internal() {
			const paths = this.paths()
			if( !paths.length ) return null

			for( const path of paths ) {
				const version = $node.fs.statSync( path ).mtime.valueOf()
				if( this.versions[ path ] && this.versions[ path ] !== version ) {
					const watcher = this.watchers.get( path )
					if( watcher ) watcher( path, 2 )
				}
				this.versions[ path ] = version
			}

			this.run()
		}

		recheck() {
			this.host()
			this.recheck_internal()
			return this.changes_cut()
		}

		@ $mol_mem
		protected host() {
			const paths = this.paths()
			if( !paths.length ) return null

			const host = $node.typescript.createWatchCompilerHost(
				paths as string[],
				{
					... this.options(),
					emitDeclarationOnly: true,
				},
				{
					... $node.typescript.sys,
					watchDirectory: ( path: string, cb: ( path: string, kind: number )=> void )=> {
						this.watchers.set( path, cb )
						return { close(){} }
					},
					writeFile: ( path: string, data: string )=> {
						this.write_add( path, data )
					},
					setTimeout: ( cb: any )=> {
						this.run = cb
					},
					watchFile: ( path: string, cb: ( path: string, kind: number )=> void )=> {
						this.watchers.set( path, cb )
						return { close(){} }
					},
				},
				$node.typescript.createEmitAndSemanticDiagnosticsBuilderProgram,
				( diagnostic: import('typescript').Diagnostic )=> {
					if( diagnostic.file ) {
						const error = $node.typescript.formatDiagnostic( diagnostic, {
							getCurrentDirectory: ()=> this.root_path(),
							getCanonicalFileName: ( path: string )=> path.toLowerCase(),
							getNewLine: ()=> '\n',
						})
						this.error_add( diagnostic.file.getSourceFile().fileName, error )
					} else {
						const text = diagnostic.messageText
						this.$.$mol_log3_fail({
							place: `${this}.host()`,
							message: typeof text === 'string' ? text : text.messageText,
						})
					}
				},
				()=> {},
				[],
				{
					synchronousWatchDirectory: true,
					watchFile: 5,
					watchDirectory: 0,
				},
			)

			const service = $node.typescript.createWatchProgram( host )

			return {
				destructor: ()=> service.close(),
			}
		}

	}

}
