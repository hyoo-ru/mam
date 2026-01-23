namespace $ {
	export class $mam_bundle_audit_js extends $mam_bundle {
		@$mol_mem_key
		generated(slice: $mam_slice) {
			const start = Date.now()

			const prefix = slice.prefix()
			const output = slice.pack().output()
			const target = output.resolve(`${prefix}.audit.js`)

			const errors = this.check_types(slice)

			this.log(target, Date.now() - start)

			if (errors.length) {
				// Log warnings instead of failing - audit is non-blocking
				for (const error of errors) {
					this.$.$mol_log3_warn({
						place: `${this}.check_types()`,
						message: error.message.split('\n')[0],
						hint: 'TypeScript audit warning (non-blocking)',
					})
				}
				target.text(
					`console.warn( '%c ▫ $mol_build ▫ Audit has ${errors.length} warnings', 'color:orange; font-weight:bolder' )`,
				)
			} else {
				target.text(
					`console.info( '%c ▫ $mol_build ▫ Audit passed', 'color:forestgreen; font-weight:bolder' )`,
				)
			}

			return [target]
		}

		@$mol_mem_key
		ts_paths(slice: $mam_slice) {
			const sources = [...slice.files()].filter(src => {
				if (!/\.(?:tsx?|d\.ts)$/.test(src.name())) return false
				if (/\/-view\.tree\//.test(src.path()) && /\.tsx?$/.test(src.name())) return false
				return true
			})

			const path_set = new Set(sources.map(src => src.path()))

			// Ensure base $ typings are present for audit.
			const mam_types = this.root().dir().resolve('mam.ts')
			if (mam_types.exists() && !path_set.has(mam_types.path())) {
				sources.unshift(mam_types)
				path_set.add(mam_types.path())
			}

			// Include generated view.tree typings even if they are not in the slice file list.
			for (const file of slice.files()) {
				if (!/\.view\.tree$/.test(file.name())) continue
				const dts = file.parent().resolve(`-view.tree/${file.name()}.d.ts`)
				if (!dts.exists()) continue
				if (path_set.has(dts.path())) continue
				sources.push(dts)
				path_set.add(dts.path())
			}

			// Add bundled .d.ts from prod slice for type resolution
			const prefix = slice.prefix()
			const output = slice.pack().output()

			// For test slice, include prod slice's .d.ts bundle
			if (/test/.test(prefix)) {
				const prod_prefix = prefix.replace('.test', '')
				const prod_dts = output.resolve(`${prod_prefix}.d.ts`)

				// Generate prod .d.ts first if needed
				const prod_slice_class = /node/.test(prefix) ? this.$.$mam_slice_node_prod : this.$.$mam_slice_web_prod
				const prod_slice = slice.pack().slice(prod_slice_class)

				// Trigger dts bundle generation for prod slice
				this.root().bundle(this.$.$mam_bundle_dts).generated(prod_slice)

				if (prod_dts.exists()) {
					sources.unshift(prod_dts) // Add at the beginning for priority
				}
			}

			if (/node/.test(prefix)) {
				const lines = [] as string[]
				for (let dep of (slice as $mam_slice_node).node_deps()) {
					lines.push('\t' + JSON.stringify(dep) + ': typeof import( ' + JSON.stringify(dep) + ' )')
				}
				if (lines.length > 0) {
					const node_types = slice.pack().dir().resolve(`-node/deps.d.ts`)
					node_types.text('interface $node {\n ' + lines.join('\n') + '\n}')
					sources.push(node_types)
				}
			}

			return sources.map(src => src.path())
		}

		@$mol_mem_key
		ts_host(slice: $mam_slice) {
			const host = $node.typescript.createCompilerHost(this.root().ts_options())

			host.fileExists = (path: string) => $mol_file.absolute(path).exists()
			host.readFile = (path: string) => {
				const file = $mol_file.absolute(path)
				return file.exists() ? file.text() : undefined
			}
			host.writeFile = (path: string, text: string) => {
				$mol_file.absolute(path).text(text, 'virt')
			}

			return host
		}

		@$mol_mem_key
		check_types(slice: $mam_slice) {
			const paths = this.ts_paths(slice)
			if (!paths.length) return []

			const options = {
				...this.root().ts_options(),
				noEmit: true,
				skipLibCheck: true,
			}

			const host = this.ts_host(slice)
			const program = $node.typescript.createProgram(paths, options, host)

			const diagnostics = [...program.getSemanticDiagnostics(), ...program.getSyntacticDiagnostics()]

			const errors: Error[] = []

			for (const diagnostic of diagnostics) {
				if (!diagnostic.file) {
					this.$.$mol_log3_warn({
						place: `${this}.check_types()`,
						message:
							typeof diagnostic.messageText === 'string'
								? diagnostic.messageText
								: diagnostic.messageText.messageText,
						hint: 'Global TypeScript diagnostic',
					})
					continue
				}

				const error = $node.typescript.formatDiagnostic(diagnostic, {
					getCurrentDirectory: () => this.root().dir().path(),
					getCanonicalFileName: (path: string) => path.toLowerCase(),
					getNewLine: () => '\n',
				})

				errors.push(new Error(error))
			}

			return errors
		}
	}
}
