namespace $ {

	export class $mam_ensure_npm extends $mol_object2 implements $mam_ensure_plugin {

		@ $mol_mem
		root() {
			return undefined as any as $mam_root
		}

		@ $mol_mem_key
		ensure( path: string ) {

			const mod = this.$.$mol_file.absolute( path )
			const parent = mod.parent()
			const node = this.root().dir().resolve( 'node' )
			const node_modules = this.root().dir().resolve( 'node_modules' )

			if(
				[ node, node_modules ].includes( parent )
				&& mod.name() !== 'node'
				&& !mod.name().startsWith( '@' )
			) {
				this.$.$node_autoinstall( mod.name() )
				return true
			}

			if(
				[ node, node_modules ].includes( parent.parent() )
				&& parent.name().startsWith( '@' )
			) {
				this.$.$node_autoinstall( `${ parent.name() }/${ mod.name() }` )
				return true
			}

			return false
		}

	}

}
