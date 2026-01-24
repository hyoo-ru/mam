namespace $ {
	export class $mam_bundle_deps_json extends $mam_bundle {
		@$mol_mem_key
		generated(slice: $mam_slice) {
			const start = Date.now()

			const prefix = slice.prefix()
			const output = slice.pack().output()
			const root = this.root().dir()

			const list = [...slice.files()]
			if (list.length === 0) return []

			const origs = list.filter(src => !/\/-/.test(src.path()))

			const sloc = {} as Record<string, number>
			for (const src of origs) {
				if (src.type() !== 'file') continue
				const ext = src.name().replace(/^.*\./, '')
				try {
					const count = src
						.text()
						.trim()
						.split(/[\n\r]\s*/).length
					sloc[ext] = (sloc[ext] || 0) + count
				} catch {
					// non-text or unreadable
				}
			}

			const graph = slice.graph()

			const deps_in = {} as Record<string, Record<string, number>>
			for (const [dep, pair] of graph.edges_in) {
				const dep_path = dep.relate(root)
				if (!deps_in[dep_path]) deps_in[dep_path] = {}
				for (const [mod, edge] of pair) {
					deps_in[dep_path][mod.relate(root)] = edge.priority
				}
			}

			const deps_out = {} as Record<string, Record<string, number>>
			for (const [mod, pair] of graph.edges_out) {
				const mod_path = mod.relate(root)
				if (!deps_out[mod_path]) deps_out[mod_path] = {}
				for (const [dep, edge] of pair) {
					deps_out[mod_path][dep.relate(root)] = edge.priority
				}
			}

			const deps = {} as Record<string, Record<string, number>>
			for (const node of graph.nodes) {
				const node_path = node.relate(root)
				const out = graph.edges_out.get(node)
				const map = {} as Record<string, number>
				if (out) {
					for (const [dep, edge] of out) {
						map[dep.relate(root)] = edge.priority
					}
				}
				deps[node_path] = map
			}

			const data = {
				files: list.map(src => src.relate(root)),
				mods: [...graph.sorted].map(node => node.relate(root)),
				deps_in,
				deps_out,
				sloc,
				deps,
			} as const

			const target = output.resolve(`${prefix}.deps.json`)
			target.text(JSON.stringify(data))

			this.log(target, Date.now() - start)

			return [target]
		}
	}
}
