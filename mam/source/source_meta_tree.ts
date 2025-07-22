namespace $ {
	export class $mam_source_meta_tree extends $mam_source {
		static match(file: $mol_file): boolean {
			return /\.meta\.tree$/.test(file.name());
		}

		@$mol_mem
		deps() {
			const deps = super.deps();

			const tree = this.tree();
			const root_dir = this.root().dir();

			tree.select("require").kids.forEach((leaf) => {
				deps.set(root_dir.resolve(leaf.value), 0);
			});

			tree.select("include").kids.forEach((leaf) => {
				deps.set(root_dir.resolve(leaf.value), -9000);
			});

			return deps;
		}

		@$mol_mem
		tree() {
			const file = this.file();
			return $mol_tree2.fromString(file.text(), file.path());
		}
	}
}
