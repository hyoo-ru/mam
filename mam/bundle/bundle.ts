namespace $ {

	export class $mam_bundle extends $mol_object2 {

		@ $mol_mem
		build() {
			return undefined as any as $mam_build
		}
		
		sources() {
			return this.build().sources_all()
		}

		prefix() {
			return ''
		}

		suffix() {
			return ''
		}

		@ $mol_mem
		target() {
			return this.build().output().resolve( this.prefix() + this.suffix() )
		}

		generated() {
			return [ this.target() ]
		}

	}

}
