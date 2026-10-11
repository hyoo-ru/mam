namespace $ {

	export class $mam_source_js extends $mam_source {

		static refs = (()=> {
			const { repeat_greedy, word_break_only, or, space_only } = $mol_regexp

			const word = repeat_greedy( /[a-zA-Z0-9]/, 1 )
			const spaces = repeat_greedy( space_only )
			const spaces_req = repeat_greedy( space_only, 1 )
			const string_single = repeat_greedy( /[^']/ )
			const string_double = repeat_greedy( /[^"]/ )
			const path = [ "'", { path: string_single }, "'", or, '"', { path: string_double }, '"' ] as const

			return $mol_regexp.from({
				string: [ "'", string_single, "'", or, '"', string_double, '"' ],
				fqn: [ '$', { name: [ word, repeat_greedy([ /[._]/, word ]) ] } ],
				req: [ word_break_only, 'require', spaces, '(', spaces, path, spaces, ')' ],
				imp: [ word_break_only, 'import', word_break_only, [ spaces, '(', spaces, path, spaces, ')', or, spaces_req, repeat_greedy( /[^'"]/, 0 ), path ] ],
			})
		})()

		static remarks = (()=> {
			const { repeat, char_any, line_end } = $mol_regexp

			return $mol_regexp.from({
				inline: [ '//', repeat( char_any ), line_end ],
				block: [ '/*', repeat( char_any ), '*/' ],
			})
		})()

		static match( file: $mol_file ): boolean {
			return /\.js$/.test( file.ext() )
		}

		@ $mol_mem
		deps() {
			const deps = super.deps()
			const file = this.file()

			// содержимое npm-пакетов самодостаточно, регэксп-скан дал бы ложные зависимости
			if( /(^|\/)node_modules\//.test( file.relate( this.root().dir() ) ) ) return deps

			const source = file.text()

			const scan = ( source: string )=> {
				for( const line of source.split( '\n' ) ) {

					const priority = this.priority( line )

					for( const token of line.matchAll( $mam_source_js.refs ) ) {
						if( !token.groups ) continue

						const path_found = token.groups.path
						if( path_found ) {
							let path = path_found
							if( $node_internal_check( path ) ) continue
							path = path.replace( /(\/[^\/.]+)$/, '$1.js' ).replace( /\/$/, '/index.js' )

							const dep = this.path_resolve( path )
							if( dep ) this.dep_add( deps, dep, priority )
						}

						const name = token.groups.name
						if( name ) this.fqn_add( deps, name, priority )
					}
				}
			}

			for( const token of source.matchAll( $mam_source_js.remarks ) ) {
				if( token.groups ) {
					const remark = token[0]
					if( /@jsx(?:Frag)?\s+\$/.test( remark ) ) scan( remark )
				} else {
					scan( token[0] )
				}
			}

			return deps
		}
		
	}

}
