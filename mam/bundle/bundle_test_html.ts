namespace $ {

	export class $mam_bundle_test_html extends $mam_bundle {

		@ $mol_mem_key
		generated_for_pack( pack: $mam_package ) {
			const start = Date.now()
			
			const source = pack.dir().resolve( 'index.html' )
			const res = pack.output().resolve( `test.html` )

			let content = source.exists()
				? source.text()
				: `<!doctype html><meta charset="utf-8" /><body><script src="web.js" charset="utf-8"></script>`
			
			content = content.replace(
				/(<\/body>|$)/, `
				<script src="/mol/build/client/client.js" charset="utf-8"></script>
				<script src="web.test.js" charset="utf-8"></script>
				<script>
					addEventListener( 'load', ()=> setTimeout( ()=> {
						const audit =  document.createElement( 'script' )
						audit.src = 'web.test.audit.js'
						document.head.appendChild( audit )
					}, 500 ) )
				</script>
				$1`,
			)
			
			res.text( content )
			
			this.log( res, Date.now() - start )

			return [ res ]
		}

	}
	
}
