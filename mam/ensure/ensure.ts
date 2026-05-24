namespace $ {

	export interface $mam_ensure_plugin {
		ensure( path: string ): boolean
	}

	export class $mam_ensure extends $mol_object2 {

		@ $mol_mem
		root() {
			return undefined as any as $mam_root
		}

		dir() {
			return this.root().dir()
		}

		interactive() {
			return process.stdout.isTTY
		}

		pull_timeout() {
			return Number( this.$.$mol_env().MAM_PULL_TIMEOUT || 120000 )
		}

		@ $mol_mem_key
		meta( path: string ) {

			let decls = [] as $mol_tree2[]
			const pack = this.$.$mol_file.absolute( path )

			if( !pack.exists() || pack.type() !== 'dir' ) return null

			for( const file of pack.sub() ) {
				if( !/\.meta\.tree$/.test( file.name() ) ) continue
				decls.push( ... this.$.$mol_tree2_from_string( file.text(), file.path() ).kids )
			}

			return decls.length
				? this.$.$mol_tree2.list( decls, decls[0]?.span )
				: null
		}

		@ $mol_mem
		ensurer_git(): $mam_ensure_plugin {
			const ensurer = new this.$.$mam_ensure_git
			ensurer.root = () => this.root()
			ensurer.meta = path => this.meta( path )
			ensurer.pull_timeout = () => this.pull_timeout()
			ensurer.interactive = () => this.interactive()
			return ensurer
		}

		@ $mol_mem
		ensurer_fallback(): $mam_ensure_plugin {
			const ensurer = new this.$.$mam_ensure_npm
			ensurer.root = () => this.root()
			return ensurer
		}

		@ $mol_mem
		ensurers() {
			return [
				this.ensurer_git(),
			] as readonly ( $mam_ensure_plugin | null )[]
		}

		@ $mol_mem_key
		ensure( path: string ): boolean {

			const mod = this.$.$mol_file.absolute( path )
			const parent = mod.parent()

			if( mod !== this.dir() ) this.ensure( parent.path() )

			if( mod.exists() && mod.type() !== 'dir' ) return false

			for( const ensurer of this.ensurers() ) {
				if( ensurer?.ensure( path ) ) return true
			}

			if( mod.exists() ) return false

			if( parent === this.dir() ) {
				throw new Error( `Root package "${ mod.relate( this.dir() ) }" not found` )
			}

			return this.ensurer_fallback().ensure( path )
		}

	}

}
