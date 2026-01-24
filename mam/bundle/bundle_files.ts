namespace $ {
	export class $mam_bundle_files extends $mam_bundle {
		@$mol_mem_key
		generated(slice: $mam_slice) {
			const prefix = slice.prefix()
			const output = slice.pack().output()

			const root_dir = this.root().dir()

			const targets: $mol_file[] = []

			const files = [...slice.files()].filter(file => /meta.tree$/.test(file.name()))
			files.forEach(source => {
				const tree = $mol_tree2.fromString(source.text(), source.path())

				const pushFile = (file: $mol_file) => {
					const start = Date.now()
					const target = output.resolve(file.relate(root_dir))
					target.buffer(file.buffer())
					targets.push(target)
					this.log(target, Date.now() - start)
				}

				const addFilesRecursive = (file: $mol_file) => {
					if (!file.exists()) return
					const rel = file.relate(root_dir)
					if (/\/\.\w+($|\/)/.test(rel)) return
					if (/\/-\//.test(rel)) return
					if (file.type() === 'dir') {
						file.sub().forEach(sub => {
							addFilesRecursive(sub)
						})
					} else {
						pushFile(file)
					}
				}

				tree.select('deploy').kids.forEach((deploy: $mol_tree2) => {
					const path = deploy.text().replace(/^\//, '')
					if (!path) return
					addFilesRecursive(root_dir.resolve(path))
				})
			})

			return targets
		}
	}
}
