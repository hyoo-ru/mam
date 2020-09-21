namespace $ {

	export class $mam_bundle_dts extends $mam_bundle {

		@ $mol_mem
		generated() {

			const prefix = this.prefix()
			const script = this.pack().output().resolve( `${prefix}.d.ts` ) 
			const map = this.pack().output().resolve( `${prefix}.d.ts.map` ) 

			// generate bundle
			
			this.$.$mol_log3_done({
				place : '$mam_bundle_dts.generated()' ,
				message : 'Built',
				file : script.relate(),
				// sources : [ ... this.files() ].map(s=>s.relate()),
			})
			
			return [ script , map ]
		}

	}
	
}
