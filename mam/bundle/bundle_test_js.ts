namespace $ {
	export class $mam_bundle_test_js extends $mam_bundle {
		@$mol_mem_key
		generated(slice: $mam_slice) {
			const start = Date.now()

			const prefix = slice.prefix()
			const output = slice.pack().output()
			const script = output.resolve(`${prefix}.js`)
			const map = output.resolve(`${prefix}.js.map`)

			const concater = new this.$.$mol_sourcemap_builder(script.name(), ';')
			concater.add('"use strict"')

			const is_node = /node/.test(prefix)
			if (!is_node) {
				concater.add('function require' + '( path ){ return $node[ path ] }')
			}

			const all_files = [...slice.files()].filter((file: $mol_file) => /\.js$/.test(file.name()))
			if (all_files.length === 0) return []

			const prod_slice_class = is_node ? this.$.$mam_slice_node_prod : this.$.$mam_slice_web_prod
			const prod_slice = slice.pack().slice(prod_slice_class)
			const prod_files = [...prod_slice.files()]
			const prod_paths = new Set(prod_files.map((file: $mol_file) => file.path()))

			const test_files = all_files.filter((file: $mol_file) => !prod_paths.has(file.path()))
			const files = is_node
				? [...prod_files.filter((file: $mol_file) => /\.js$/.test(file.name())), ...test_files]
				: test_files

			const root_dir = this.root().dir()

			for (const file of files) {
				if (is_node && /node_modules\//.test(file.relate(root_dir))) continue

				const file_map = file.parent().resolve(file.name() + '.map')
				const content = file.text().replace(/^\/\/#\ssourceMappingURL=.*$/gm, '')

				const isCommonJs = /typeof +exports|module\.exports|\bexports\.\w+\s*=/.test(content)

				if (isCommonJs) {
					concater.add(
						`\nvar $node = $node || {}\nvoid function( module ) { var exports = module.${''}exports = this; function require( id ) { return $node[ id.replace( /^.\\//, "` +
							file.parent().relate(this.root().dir().resolve('node_modules')) +
							`/" ) ] }; \n`,
						'-',
					)
				}

				concater.add(content, file.relate(output), file_map.text() || undefined)

				if (isCommonJs) {
					const idFull = file.relate(this.root().dir().resolve('node_modules'))
					const idShort = idFull.replace(/\/index\.js$/, '').replace(/\.js$/, '')
					concater.add(
						`\n$${''}node[ "${idShort}" ] = $${''}node[ "${idFull}" ] = module.${''}exports }.call( {}, {} )\n`,
						'-',
					)
				}
			}

			const text = concater.content + `\n//# sourceMappingURL=${map.relate(output)}\n`
			script.text(text)
			map.text(JSON.stringify(concater.sourcemap))

			this.log(script, Date.now() - start)

			return [script, map]
		}
	}
}
