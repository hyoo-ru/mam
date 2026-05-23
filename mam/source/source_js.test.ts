namespace $ {
	$mol_test({

		'js refs'() {
			$mol_assert_like(
				mam_source_js_ref_tokens( '[$'+'foo_bar]' ),
				[
					{ 0: '[' },
					{
						0: '$'+'foo_bar',
						string: '',
						fqn: '$'+'foo_bar',
						name: 'foo_bar',
						req: '',
						imp: '',
						path: '',
					},
					{ 0: ']' },
				]
			)
		},

		'js string refs ignored'() {
			$mol_assert_like(
				mam_source_js_ref_tokens( '["$'+'foo_bar"]' ),
				[
					{ 0: '[' },
					{
						0: '"$'+'foo_bar"',
						string: '"$'+'foo_bar"',
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

		'js require refs'() {
			$mol_assert_like(
				mam_source_js_ref_tokens( 'require( "path/to.file" )' ),
				[
					{
						0: 'require( "path/to.file" )',
						string: '',
						fqn: '',
						name: '',
						req: 'require( "path/to.file" )',
						imp: '',
						path: 'path/to.file',
					},
				]
			)
		},

		'js import refs'() {
			$mol_assert_like(
				mam_source_js_ref_tokens( 'import foo from "path/to.file"\nimport( "lazy/file" )' ),
				[
					{
						0: 'import foo from "path/to.file"',
						string: '',
						fqn: '',
						name: '',
						req: '',
						imp: 'import foo from "path/to.file"',
						path: 'path/to.file',
					},
					{ 0: '\n' },
					{
						0: 'import( "lazy/file" )',
						string: '',
						fqn: '',
						name: '',
						req: '',
						imp: 'import( "lazy/file" )',
						path: 'lazy/file',
					},
				]
			)
		},

		'js import inside word ignored'() {
			$mol_assert_like(
				mam_source_js_ref_tokens( 'important = "path/to.file"' ),
				[
					{ 0: 'important = ' },
					{
						0: '"path/to.file"',
						string: '"path/to.file"',
						fqn: '',
						name: '',
						req: '',
						imp: '',
						path: '',
					},
				]
			)
		},

		'js remarks'() {
			$mol_assert_like(
				mam_source_js_remark_tokens( 'foo//bar\n/*baz*/lol' ),
				[
					{ 0: 'foo' },
					{ 0: '//bar\n', inline: '//bar\n', block: '' },
					{ 0: '/*baz*/', inline: '', block: '/*baz*/' },
					{ 0: 'lol' },
				]
			)
		},

	})

	function mam_source_js_ref_tokens( source: string ) {
		return [ ... source.matchAll( $mam_source_js.refs ) ].map( token => {
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

	function mam_source_js_remark_tokens( source: string ) {
		return [ ... source.matchAll( $mam_source_js.remarks ) ].map( token => {
			if( !token.groups ) return { 0: token[0] }
			return {
				0: token[0],
				inline: token.groups.inline ?? '',
				block: token.groups.block ?? '',
			}
		} )
	}
}
