namespace $ {
	$mol_test({

		'underscored fqn'() {
			$mol_assert_like(
				$mam_source_refs_js_tokens( '[$'+'123_foo_bar]' ),
				[
					{ 0: '[' },
					{
						0: '$'+'123_foo_bar',
						string: '',
						fqn: '$'+'123_foo_bar',
						name: '123_foo_bar',
						req: '',
						imp: '',
						path: '',
					},
					{ 0: ']' },
				]
			)
		},

		'dotted fqn'() {
			$mol_assert_like(
				$mam_source_refs_js_tokens( '[$'+'123.foo.bar]' ),
				[
					{ 0: '[' },
					{
						0: '$'+'123.foo.bar',
						string: '',
						fqn: '$'+'123.foo.bar',
						name: '123.foo.bar',
						req: '',
						imp: '',
						path: '',
					},
					{ 0: ']' },
				]
			)
		},

		'mixed fqn types'() {
			$mol_assert_like(
				$mam_source_refs_js_tokens( '[$'+'123_foo.bar_lol]' ),
				[
					{ 0: '[' },
					{
						0: '$'+'123_foo.bar_lol',
						string: '',
						fqn: '$'+'123_foo.bar_lol',
						name: '123_foo.bar_lol',
						req: '',
						imp: '',
						path: '',
					},
					{ 0: ']' },
				]
			)
		},

		'fqn in string'() {
			$mol_assert_like(
				$mam_source_refs_js_tokens( '["$'+'123_foo_bar"]' ),
				[
					{ 0: '[' },
					{
						0: '"$'+'123_foo_bar"',
						string: '"$'+'123_foo_bar"',
						fqn: '',
						name: '',
						req: '',
						imp: '',
						path: '',
					},
					{ 0: ']' },
				]
			)
		},

		'single quote require'() {
			$mol_assert_like(
				$mam_source_refs_js_tokens( '[require '+"( 'path/to.file' )]" ),
				[
					{ 0: '[' },
					{
						0: 'require '+"( 'path/to.file' )",
						string: '',
						fqn: '',
						name: '',
						req: 'require '+"( 'path/to.file' )",
						imp: '',
						path: 'path/to.file',
					},
					{ 0: ']' },
				]
			)
		},

		'double quote require'() {
			$mol_assert_like(
				$mam_source_refs_js_tokens( '[require '+'( "path/to.file" )]' ),
				[
					{ 0: '[' },
					{
						0: 'require '+'( "path/to.file" )',
						string: '',
						fqn: '',
						name: '',
						req: 'require '+'( "path/to.file" )',
						imp: '',
						path: 'path/to.file',
					},
					{ 0: ']' },
				]
			)
		},

		'require in string'() {
			$mol_assert_like(
				$mam_source_refs_js_tokens( `["require `+`( 'path/to.file' )"]` ),
				[
					{ 0: '[' },
					{
						0: `"require `+`( 'path/to.file' )"`,
						string: `"require `+`( 'path/to.file' )"`,
						fqn: '',
						name: '',
						req: '',
						imp: '',
						path: '',
					},
					{ 0: ']' },
				]
			)
		},

		'static import'() {
			$mol_assert_like(
				$mam_source_refs_js_tokens( '[import foo from "path/to.file"]' ),
				[
					{ 0: '[' },
					{
						0: 'import foo from "path/to.file"',
						string: '',
						fqn: '',
						name: '',
						req: '',
						imp: 'import foo from "path/to.file"',
						path: 'path/to.file',
					},
					{ 0: ']' },
				]
			)
		},

		'dynamic import'() {
			$mol_assert_like(
				$mam_source_refs_js_tokens( '[import( "path/to.file" )]' ),
				[
					{ 0: '[' },
					{
						0: 'import( "path/to.file" )',
						string: '',
						fqn: '',
						name: '',
						req: '',
						imp: 'import( "path/to.file" )',
						path: 'path/to.file',
					},
					{ 0: ']' },
				]
			)
		},

		'import in string'() {
			$mol_assert_like(
				$mam_source_refs_js_tokens( `["import foo from 'path/to.file'"]` ),
				[
					{ 0: '[' },
					{
						0: `"import foo from 'path/to.file'"`,
						string: `"import foo from 'path/to.file'"`,
						fqn: '',
						name: '',
						req: '',
						imp: '',
						path: '',
					},
					{ 0: ']' },
				]
			)
		},

		'import inside word'() {
			$mol_assert_like(
				$mam_source_refs_js_tokens( `important = "path/to.file"` ),
				[
					{ 0: `important = ` },
					{
						0: `"path/to.file"`,
						string: `"path/to.file"`,
						fqn: '',
						name: '',
						req: '',
						imp: '',
						path: '',
					},
				]
			)
		},

	})

	function $mam_source_refs_js_tokens( source: string ) {
		return [ ... source.matchAll( $mam_source_refs_js ) ].map( token => {
			if( !token.groups ) return { 0: token[0] }
			return {
				0: token[0],
				string: token.groups.string ?? '',
				fqn: token.groups.fqn ?? '',
				name: token.groups.name ?? '',
				req: token.groups.req ?? '',
				imp: token.groups.imp ?? '',
				path: token.groups.path ?? '',
			}
		} )
	}
}
