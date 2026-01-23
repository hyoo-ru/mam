namespace $ {
	export class $mam_source_view_tree_ts extends $mam_source {
		static match(file: $mol_file): boolean {
			// только реальные скомпиленные view.tree-ts, а не исходные *.view.ts
			return /\/-view\.tree\/[^/]+\.ts$/.test(file.path())
		}

		@$mol_mem
		deps() {
			return super.deps()
		}
	}
}
