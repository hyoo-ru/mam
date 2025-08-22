namespace $ {
	export class $mam_source_view_tree_ts extends $mam_source {
		static match(file: $mol_file): boolean {
			// только реальные скомпиленные view.tree-ts, а не исходные *.view.ts
			return /\/-view\.tree\/[^/]+\.ts$/.test(file.path());
		}

		@$mol_mem
		deps() {
			const deps = super.deps();
			const file = this.file();

			// каталог компонента (на уровень выше -view.tree)
			const comp_dir = file.parent().parent();

			// базовый *.view.ts
			const base_ts = comp_dir.resolve(file.name().replace(/\.view\.tree\.ts$/, ".view.ts"));
			if (base_ts.exists()) deps.set(base_ts, 0);

			// соседи *.view.css.ts (часто нужны типам стиля)
			const css_ts = comp_dir.resolve(file.name().replace(/\.view\.tree\.ts$/, ".view.css.ts"));
			if (css_ts.exists()) deps.set(css_ts, 0);

			return deps;
		}
	}
}
