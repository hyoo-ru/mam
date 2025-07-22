namespace $ {
	/** Building MAM package */
	export class $mam_package extends $mol_object2 {
		@$mol_mem
		root() {
			return undefined as any as $mam_root;
		}

		@$mol_mem
		dir() {
			return undefined as any as $mol_file;
		}

		@$mol_mem
		output(next?: $mol_file) {
			return this.dir().resolve("-");
		}

		@$mol_mem
		slice_classes(): (typeof $mam_slice)[] {
			return [
				this.$.$mam_slice_web_prod,
				this.$.$mam_slice_node_prod,
				this.$.$mam_slice_web_test,
				this.$.$mam_slice_node_test,
			];
		}

		@$mol_mem_key
		slice<Slice extends typeof $mam_slice>(Slice: Slice) {
			const slice = new Slice();
			slice.pack = $mol_const(this);
			return slice as InstanceType<Slice>;
		}

		@$mol_mem
		slices() {
			return this.slice_classes().map((ctor) => this.slice(ctor));
		}

		@$mol_mem
		bundles_generated() {
			const files = new Set<$mol_file>();

			for (const slice of this.slices()) {
				for (const file of slice.bundles_generated()) {
					files.add(file);
				}
			}

			return files;
		}

		@$mol_mem
		meta() {
			const decls = [] as $mol_tree2[];

			for (const file of this.dir().sub()) {
				const tree = this.root().source([this.$.$mam_source_meta_tree, file])?.tree();
				if (tree) decls.push(...tree.kids);
			}

			return new $mol_tree2("", "", decls, $mol_span.unknown);
		}

		@$mol_mem
		ensure() {
			const dir = this.dir();

			const parent = dir.parent();
			const root = this.root();

			if (dir !== root.dir()) root.pack(parent).ensure();

			const mapping =
				dir === root.dir()
					? $mol_tree2.fromString(`pack ${dir.name()} git \\https://github.com/hyoo-ru/mam.git\n`)
					: root.pack(parent).meta();

			if (dir.exists()) {
				try {
					if (dir.type() !== "dir") return false;

					const git_dir = dir.resolve(".git");
					if (git_dir.exists()) {
						this.$.$mol_exec(dir.path(), "git", "pull", "--deepen=1");
						// mod.reset()
						// for ( const sub of mod.sub() ) sub.reset()

						return false;
					}

					for (let repo of mapping.select("pack", dir.name(), "git").kids) {
						this.$.$mol_exec(dir.path(), "git", "init");

						const res = this.$.$mol_exec(dir.path(), "git", "remote", "show", repo.value);
						const matched = res.stdout.toString().match(/HEAD branch: (.*?)\n/);
						const head_branch_name =
							res instanceof Error || matched === null || !matched[1] ? "master" : matched[1];

						this.$.$mol_exec(
							dir.path(),
							"git",
							"remote",
							"add",
							"--track",
							head_branch_name!,
							"origin",
							repo.value,
						);
						this.$.$mol_exec(dir.path(), "git", "pull", "--deepen=1");
						dir.reset();
						for (const sub of dir.sub()) {
							sub.reset();
						}
						return true;
					}
				} catch (error: any) {
					this.$.$mol_log3_fail({
						place: `${this}.modEnsure()`,
						path: dir.path(),
						message: error.message,
					});
				}

				return false;
			}

			for (let repo of mapping.select("pack", dir.name(), "git").kids) {
				this.$.$mol_exec(root.dir().path(), "git", "clone", "--depth", "1", repo.value, dir.relate(root.dir()));
				dir.reset();
				return true;
			}

			if (parent === root.dir()) {
				throw new Error(`Root package "${dir.relate(root.dir())}" not found`);
			}

			return false;
		}
	}
}
