namespace $ {

	export class $mam_bundle_mjs extends $mam_bundle {

		@ $mol_mem_key
		generated( slice: $mam_slice ) {
			const start = Date.now()
			const [ targetJS, targetJSMap ] = this.root().bundle( this.$.$mam_bundle_js ).generated( slice )
			if (! targetJS) return []

			const targetMJS = targetJS.parent().resolve( targetJS.name().replace(/\.js$/, '.mjs') )
			targetMJS.text( targetJS.text().replace(/(^\/\/# sourceMappingURL.*)/m, 'export default $\n$1') )

			this.log( targetMJS , Date.now() - start )

			return [ targetMJS, targetJSMap ]
		}

	}

}
