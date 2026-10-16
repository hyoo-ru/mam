# AGENTS.md

## Wordspace overview

This workspace is the MAM codebase: a large set of Abstract Modules (MAM modules) - directories with sources on different languages which has cross-language dependencies from other MAM module. MAM builder tracks dependencies across MAM modules through its usage by FQN (Fully Qualified Name). FQN bidirectionally maps to file paths. Examples:
- In JS/TS: `$acme_project_tool` -> `/acme/project/tool/`
- In CSS/GLSL: `acme_project_tool` -> `/acme/project/tool/`

All sources from MAM module are bundled to relevant bundle. File names may have tags (`.test.`, `.web.`, `.node.`, `.locale=*.`) to specify which bundle should contain that source. All bundles are generated to `-` directory.

MAM doesn't different applications, components, modules, projects etch. Any MAM module can be fractal decomposed to inner MAM modules, which can be extracted to different repos with inner MAM modules etc. `meta.tree` sources define from which repo MAM builder should pull sources. Whole build logic is defined in `$mol_build`.

## Working conventions

- Read `README.md` in any MAM module to understand how to work with it right.
- Use [](.editorconfig) and [](.vscode/settings.json) to format sources right.
- Prefer small, local edits inside the nearest module rather than introducing cross-cutting framework changes.
- Prefer MAM modules rather than native API or NPM dependencies.
- Keep directory structure and naming aligned with surrounding modules and their namespace conventions.
- For browser or UI work, follow the patterns already used in the same module family.
- New modules should be self-contained and should usually include a minimal by complete tests for non trivial logic and `demo` submodule for widgets.
- Avoid adding broad abstractions unless the local module already uses them.
