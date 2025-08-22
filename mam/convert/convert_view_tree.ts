namespace $ {
	export class $mam_convert_view_tree extends $mam_convert {
		static match(file: $mol_file): boolean {
			return /\.view\.tree$/.test(file.name());
		}

		@$mol_mem
		tree() {
			const source = this.source();
			const text = source.text();
			return this.$.$mol_tree2_from_string(text, source.path());
		}

		// Генерим артефакты
		@$mol_mem
		generated() {
			return [this.locale()];
		}

		// Источники, которые становятся входом для дальнейшей обработки (TS → JS и т.п.)
		@$mol_mem
		generated_sources() {
			return [this.script()];
		}

		@$mol_mem
		script() {
			const source = this.source();
			const js_text = this.$.$mol_tree2_text_to_string(
				this.$.$mol_tree2_js_to_text(this.$.$mol_view_tree2_to_js(this.tree())),
			);

			const script = source.parent().resolve(`-view.tree/${source.name()}.ts`);
			script.text(js_text);
			return script;
		}

		@$mol_mem
		locale() {
			const source = this.source();
			const locale_obj = this.$.$mol_view_tree2_to_locale(this.tree());
			const locale = source.parent().resolve(`-view.tree/${source.name()}.locale=en.json`);
			locale.text(JSON.stringify(locale_obj, null, "\t"));
			return locale;
		}

		// Если хотите вернуть d.ts из view.tree (как делал старый билдер) — раскомментируйте ниже
		@$mol_mem
		dts() {
			const source = this.source();
			const dts_tree = this.$.$mol_view_tree2_to_dts(this.tree());

			const dts = source.parent().resolve(`-view.tree/${source.name()}.d.ts`);
			const dts_map = source.parent().resolve(`-view.tree/${source.name()}.d.ts.map`);

			const dts_map_raw = this.$.$mol_tree2_text_to_sourcemap(dts_tree);
			delete (dts_map_raw as any).sourcesContent;
			dts_map_raw.file = dts.relate(dts.parent());
			dts_map_raw.sourceRoot = this.root().dir().relate(dts.parent());

			dts.text(
				this.$.$mol_tree2_text_to_string(dts_tree) + "\n//# sourceMappingURL=" + dts_map.relate(dts.parent()),
			);
			dts_map.text(JSON.stringify(dts_map_raw, null, "\t"));

			return dts;
		}
	}
}
