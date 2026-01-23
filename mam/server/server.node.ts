namespace $ {
	const trace_hinted = new WeakSet<Error>()

	/**
	 * Dev server for MAM builder.
	 * Extends $mol_server directly to avoid $mol_build auto-start.
	 */
	export class $mam_server extends $mol_server {
		static trace = false

		@$mol_mem
		mam_root() {
			return new this.$.$mam_root()
		}

		sync_middleware(
			mdl: (req: typeof $node.express.request, res: typeof $node.express.response) => void | boolean,
		) {
			const wrapped = $mol_wire_async(mdl)

			return $mol_func_name_from(
				async (
					req: typeof $node.express.request,
					res: typeof $node.express.response,
					next: (err?: unknown) => any,
				) => {
					try {
						const stopped = await wrapped(req, res)
						if (!stopped) Promise.resolve().then(next)
					} catch (err) {
						const error = err instanceof Error ? err : new Error(String(err), { cause: err })

						if (!this.$.$mam_server.trace && !trace_hinted.has(error)) {
							error.message += '\n' + 'Set $mam_server.trace = true for stacktraces'
							trace_hinted.add(error)
						}

						res.status(500).send(error.toString()).end()

						this.$.$mol_log3_fail({
							place: `${this}.${mdl.name}()`,
							uri: req.path,
							stack: this.$.$mam_server.trace ? error.stack : undefined,
							message: error.message,
						})
					}
				},
				mdl,
			)
		}

		expressGenerator() {
			return this.sync_middleware(this.handleRequest.bind(this))
		}

		handleRequest(req: typeof $node.express.request, res: typeof $node.express.response) {
			try {
				if (!this.generate(req.url)) return false
				res.set('Cache-Control', 'no-cache, public')
			} catch (error: any) {
				if ($mol_promise_like(error)) $mol_fail_hidden(error)

				if (!req.url.match(/\.js$/)) $mol_fail_hidden(error)

				this.$.$mol_log3_fail({
					place: `${this}.handleRequest()`,
					uri: req.path,
					message: error.message,
					stack: error.stack,
				})

				const script = (error as Error).message
					.split('\n\n')
					.map(msg => {
						return `console.error( ${JSON.stringify(msg)} )`
					})
					.join('\n')

				res.send(script).end()
				return true
			}
		}

		@$mol_mem_key
		generate(url: string) {
			$mol_wire_solid()

			// Parse URL: /path/to/module/-/bundle.js
			const matched = url.match(/^(.*?)\/-\/((?:(?:\w+(?:.\w+)+)(?:\/-\/)?)+)$/)
			if (!matched) return null

			const [, rawpath, bundle] = matched
			const root = this.mam_root()
			const relpath = rawpath.replace(/^\/+/, '')
			const dir = root.dir().resolve(relpath)

			if (bundle === 'web.css') {
				this.$.$mol_log3_warn({
					place: `${this}.generate()`,
					message: 'CSS compiles into JS bundle now',
					hint: 'Remove link to web.css',
				})
			}

			// Ensure the package exists (git clone if needed)
			const pack = root.pack(dir)

			// Determine slice based on bundle name
			const match = bundle.match(/^(web|node)(\.test)?\.(.*?)$/)

			if (match) {
				const [, env, test] = match
				const isTest = !!test
				const isNode = env === 'node'

				let slice_class: typeof $mam_slice
				if (isNode) {
					slice_class = isTest ? this.$.$mam_slice_node_test : this.$.$mam_slice_node_prod
				} else {
					slice_class = isTest ? this.$.$mam_slice_web_test : this.$.$mam_slice_web_prod
				}

				const slice = pack.slice(slice_class)
				slice.bundles_generated()
			} else {
				// For other bundles (index.html, etc), generate all
				pack.bundles_generated()
			}

			const output = pack.output()
			const target = output.resolve(bundle)

			return target.exists() ? [target] : []
		}

		override expressIndex() {
			return this.sync_middleware(this.expressIndexRequest.bind(this))
		}

		@$mol_mem_key
		protected ensure(path: string) {
			$mol_wire_solid()
			const dir = this.$.$mol_file.absolute(path)
			this.mam_root().pack(dir).ensure()
		}

		expressIndexRequest(req: typeof $node.express.request, res: typeof $node.express.response) {
			const root = this.$.$mol_file.absolute(this.rootPublic())
			const relpath = req.path.replace(/^\/+/, '')
			const dir = root.resolve(relpath)
			const path = dir.path()

			this.ensure(path)

			const match = req.url.match(/(\/|.*[^\-]\/)([\?#].*)?$/)
			if (!match) return

			const file = dir.resolve('index.html')

			if (file.exists()) {
				res.redirect(301, `${match[1]}-/test.html${match[2] ?? ''}`)
				return true
			}

			if (dir.type() !== 'dir') return

			const files = [{ name: '-', type: 'dir' }]

			for (const file of dir.sub()) {
				if (!files.find(({ name }) => name === file.name())) {
					files.push({ name: file.name(), type: file.type() })
				}

				if (/\.meta\.tree$/.test(file.name())) {
					const meta = this.$.$mol_tree2_from_string(file.text())

					for (const pack of meta.select('pack', null).kids) {
						if (files.find(({ name }) => name === pack.type)) continue
						files.push({ name: pack.type, type: 'dir' })
					}
				}
			}

			const html =
				`
				<style>
					body {
						display: flex;
						flex-direction: column;
						flex-wrap: wrap;
						font: 1rem/1.5rem sans-serif;
						height: 100%;
						margin: 0;
						padding: 0.75rem;
						box-sizing: border-box;
					}
					a {
						text-decoration: none;
						color: rgb(57, 115, 172);
						font-weight: bolder;
					}
					a:hover {
						background: hsl( 0deg, 0%, 0%, .05 )
					}
					a[href^="."], a[href^="-"], a[href="node_modules"] {
						opacity: 0.5;
					}
					a[href=".."], a[href="-"] {
						opacity: 1;
					}
				</style>
				<link href="/_logo.png" rel="icon" />
				<a href="..">&#x1F4C1; ..</a>
				` +
				files
					.sort($mol_compare_text(item => item.type))
					.map(
						file =>
							`<a href="${file.name}">${file.type === 'dir' ? '&#x1F4C1;' : '&#128196;'} ${file.name}</a>`,
					)
					.join('\n')

			res.writeHead(200, {
				'Content-Type': 'text/html',
				'Access-Control-Allow-Origin': '*',
			})

			res.end(html)
			return true
		}

		port() {
			return 9080
		}

		@$mol_mem
		lines(next = new Map<InstanceType<$node['ws']['WebSocket']>, string>()) {
			return next
		}

		@$mol_mem
		override socket() {
			const root = this.mam_root().dir()

			return super.socket().on('connection', (line, req) => {
				const path_relative = req.url!.replace(/\/-.*/, '').substring(1)
				const path = root.resolve(path_relative).path()

				this.$.$mol_log3_rise({
					place: this,
					message: `Connect`,
					path,
				})

				this.lines(new Map([...this.lines(), [line, path]]))

				line.on('close', () => {
					const lines = new Map(this.lines())
					lines.delete(line)
					this.lines(lines)
				})
			})
		}

		@$mol_mem
		start() {
			const socket = this.socket()

			for (const [line, path] of this.lines()) {
				this.notify([line, path])
			}

			return socket
		}

		@$mol_mem_key
		bundle_changed_at(path: string) {
			try {
				const dir = this.$.$mol_file.absolute(path)
				const pack = this.mam_root().pack(dir)
				const slice = pack.slice(this.$.$mam_slice_web_prod)

				for (const src of slice.files()) {
					src.version()
				}
			} catch (error) {
				if ($mol_fail_catch(error)) {
					this.$.$mol_log3_fail({
						place: `${this}.bundle_changed_at`,
						message: (error as Error)?.message,
						path,
					})
				}
			}

			return new Date()
		}

		@$mol_mem_key
		notify([line, path]: [InstanceType<$node['ws']['WebSocket']>, string]) {
			this.bundle_changed_at(path)

			if (!$mol_mem_cached(() => this.notify([line, path]))) return true

			this.$.$mol_log3_rise({
				place: `${this}`,
				message: `$mol_build_obsolete`,
				path,
			})

			line.send('$mol_build_obsolete')

			return true
		}
	}
}
