namespace $ {
	type ts_Node = import("typescript").Node;

	export class $mam_source_ts extends $mam_source {
		static match(file: $mol_file): boolean {
			return /tsx?$/.test(file.ext());
		}

		@$mol_mem
		deps() {
			const deps = this.ts_source_deps().mam_deps;

			const file = this.file();

			let name_parts = file.name().split(".");

			while (name_parts.length > 2) {
				name_parts.splice(-2, 1);

				const dep = file.parent().resolve(name_parts.slice(0, -1).join(".") + ".ts");
				if (dep.exists()) deps.set(dep, 0);
			}

			return deps;
		}

		@$mol_mem
		ts_source() {
			const file = this.file();
			const target = this.root().ts_options().target!;
			return $node.typescript.createSourceFile(file.path(), file.text(), target);
		}

		@$mol_mem
		ts_source_deps() {
			const file = this.file();

			const mam_deps = new Map<$mol_file, number>();
			const node_deps: Set<string> = new Set();

			if (!/tsx?$/.test(file.ext())) return { mam_deps, node_deps };

			const ts_source = this.ts_source();

			const visit = (node: ts_Node, parents: ts_Node[], priority: number) => {
				// NEW: $.$mol_* -> добавить зависимость на mol/*
				if ($node.typescript.isPropertyAccessExpression(node)) {
					const left = node.expression;
					const right = node.name;
					if (
						$node.typescript.isIdentifier(left) &&
						left.escapedText === "$" &&
						$node.typescript.isIdentifier(right) &&
						/^\$[A-Za-z0-9_]+$/.test(String(right.escapedText))
					) {
						const fqn = String(right.escapedText).slice(1); // "mol_foo"
						const dep = this.lookup(fqn.replace(/[._]/g, "/"));
						const existed = mam_deps.get(dep);
						if (!existed || existed < priority) mam_deps.set(dep, priority);
					}
				}

				if (!$node.typescript.isIdentifier(node)) {
					node.forEachChild((child) => visit(child, [...parents, node], priority - 1));
					return;
				}

				const text = node.escapedText as string;
				if (text === "require" && $node.typescript.isCallExpression(parents[0])) {
					const arg = parents[0].arguments[0];
					if (!$node.typescript.isStringLiteral(arg)) return;

					const dep = this.file().resolve(arg.text);
					const existed = mam_deps.get(dep);
					if (!existed || existed < priority) mam_deps.set(dep, priority);

					return;
				}

				const fqn = text.match(/\$([^$]*)/)?.[1];
				if (!fqn) return;

				if (fqn === "node") {
					let parent =
						(parents.at(-1) as any)?.name?.escapedText?.[0] === "$" ? parents.at(-2)! : parents.at(-1)!;

					if ($node.typescript.isPropertyAccessExpression(parent)) {
						node_deps.add(parent.name.escapedText as string);
					} else if (
						$node.typescript.isElementAccessExpression(parent) &&
						$node.typescript.isStringLiteral(parent.argumentExpression)
					) {
						node_deps.add(parent.argumentExpression.text);
					}
				}

				const dep = this.lookup(fqn.replace(/[._]/g, "/"));
				const existed = mam_deps.get(dep);
				if (!existed || existed < priority) mam_deps.set(dep, priority);
			};

			ts_source.forEachChild((child) => visit(child, [ts_source], 0));

			node_deps.forEach((name) => {
				$node[name]; // force autoinstall through npm
			});

			return { mam_deps, node_deps };
		}
	}
}
