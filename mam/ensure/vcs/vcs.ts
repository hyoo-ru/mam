namespace $ {

	export class $mam_ensure_vcs extends $mol_object2 implements $mam_ensure_plugin {

		@ $mol_mem
		root() {
			return undefined as any as $mam_root
		}

		interactive() {
			return process.stdout.isTTY
		}

		pull_timeout() {
			return 120000
		}

		root_repo() {
			return null as null | string
		}

		vcs_type() {
			return null as null | string
		}

		protected inited( path: string ) {
			return false
		}

		protected init_existing( path: string ) {
			return null
		}

		protected update( path: string ) {
			return false
		}

		protected init( path: string ) {
			return null
		}

		@ $mol_mem_key
		meta( path: string ) {
			return null as $mol_tree2 | null
		}

		@ $mol_mem_key
		protected repo( path: string ) {

			const vcs_type = this.vcs_type()
			if( !vcs_type ) return null

			const mod = this.$.$mol_file.absolute( path )
			const root_dir = this.root().dir()
			const root_url = this.root_repo()
			if( mod === root_dir ) return !root_url ? null : { url: root_url, branch: null as null | string }

			const parent = mod.parent()
			const mapping = this.meta( parent.path() )

			const url_branch = mapping?.select( 'pack', mod.name(), vcs_type ).kids
				.find( $mol_guard_defined )?.kids[0]

			const url = url_branch?.value ?? null
			const branch = url_branch?.kids[0]?.value ?? null

			return url ? { url, branch } : null
		}

		protected update_disabled = false
		static ensured = new Set< string >()

		protected pull_disabled() {
			return true //Boolean( this.$.$mol_env().MAM_PULL_DISABLED )
		}

		@ $mol_action
		protected update_safe( dir: string ) {
			if( this.update_disabled ) return false

			try {
				return this.$.$mol_file.unwatched( () => this.update( dir ), dir )
			} catch( error ) {
				if( error instanceof $mol_run_error && error.cause.timeout_kill ) {
					this.$.$mol_log3_warn({
						place: `${this}.update_safe()`,
						message: `Timeout - pull disabled`,
						hint: 'Check connection',
					})
					this.update_disabled = true
					return true
				}

				if( error instanceof Error ) {
					this.$.$mol_fail_log( error )
					return false
				}

				$mol_fail_hidden( error )
			}
		}

		@ $mol_mem_key
		ensure( path: string ) {

			const mod = this.$.$mol_file.absolute( path )
			const ensured_key = mod.path()

			if( mod.exists() ) {
				if( this.pull_disabled() ) return false
				if( $mam_ensure_vcs.ensured.has( ensured_key ) ) return true

				if( !this.inited( path ) ) {
					if( !this.repo( path ) ) return false

					this.$.$mol_file.unwatched( () => this.init_existing( path ), path )
					$mam_ensure_vcs.ensured.add( ensured_key )
					return true
				}

				this.update_safe( path )
				$mam_ensure_vcs.ensured.add( ensured_key )
				return true
			}

			if( this.repo( path ) ) {
				if( $mam_ensure_vcs.ensured.has( ensured_key ) ) return true
				this.$.$mol_file.unwatched( () => this.init( path ), path )
				$mam_ensure_vcs.ensured.add( ensured_key )
				return true
			}

			return false
		}

	}

}
