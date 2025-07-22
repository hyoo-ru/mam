namespace $ {
	export class $mam_convert_view_tree extends $mam_convert {
		static match(file: $mol_file): boolean {
			return /\.view\.tree$/.test(file.name());
		}

		@$mol_mem
		generated() {
			return [this.locale()];
		}

		@$mol_mem
		generated_sources() {
			return [this.script()];
		}

		@$mol_mem
		tree() {
			const source = this.source();

			const text = source.text();
			return this.$.$mol_tree2_from_string(text, source.path());
		}

		@$mol_mem
		compiled() {
			return this.$.$mol_view_tree2_child(this.tree());
		}

		@$mol_mem
		script() {
			const source = this.source();

			const script = source.parent().resolve(`-view.tree/${source.name()}.ts`);
			script.text(this.compiled().toString());
			// const sourceMap = source.parent().resolve( `-view.tree/${ name }.map` )
			// sourceMap.text( res.map )

			return script;
		}

		@$mol_mem
		locale() {
			const source = this.source();

			const locale = source.parent().resolve(`-view.tree/${source.name()}.locale=en.json`);
			locale.text(JSON.stringify(this.compiled().toLocaleString(), null, "\t"));

			return locale;
		}
	}
}
