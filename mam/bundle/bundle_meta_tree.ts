namespace $ {
	export class $mam_bundle_meta_tree extends $mam_bundle {
		@$mol_mem_key
		generated(slice: $mam_slice) {
			const start = Date.now();

			const prefix = slice.prefix();
			const root = this.root();

			const target = slice.pack().output().resolve(`${prefix}.meta.tree`);

			const files = slice.graph().sorted;

			const named_metas: $mol_tree2[] = [];
			files.forEach((file) => {
				if (file.type() !== "dir") return;
				const meta = root.pack(file).meta();
				if (meta.kids.length > 0) {
					named_metas.push(new $mol_tree2("", "/" + file.relate(root.dir()), meta.kids, meta.span));
				}
			});

			if (named_metas.length === 0) return [];

			target.text(new $mol_tree2("", "", named_metas, $mol_span.unknown).toString());

			this.log(target, Date.now() - start);

			return [target];
		}
	}
}
