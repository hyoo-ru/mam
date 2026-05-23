namespace $ {
	$mol_test({

		'code without remarks'() {
			$mol_assert_like(
				$mam_source_remarks_js_tokens( 'foo\nbar' ),
				[
					{ 0: 'foo\nbar' },
				]
			)
		},

		'inline remarks'() {
			$mol_assert_like(
				$mam_source_remarks_js_tokens( 'foo//bar\nlol' ),
				[
					{ 0: 'foo' },
					{ 0: '//bar\n', inline: '//bar\n', block: '' },
					{ 0: 'lol' },
				]
			)
		},

		'block remarks'() {
			$mol_assert_like(
				$mam_source_remarks_js_tokens( 'foo/*bar\nlol*/xxx' ),
				[
					{ 0: 'foo' },
					{ 0: '/*bar\nlol*/', inline: '', block: '/*bar\nlol*/' },
					{ 0: 'xxx' },
				]
			)
		},

		'inline inside block remarks'() {
			$mol_assert_like(
				$mam_source_remarks_js_tokens( '/*foo//bar*/\n*/' ),
				[
					{ 0: '/*foo//bar*/', inline: '', block: '/*foo//bar*/' },
					{ 0: '\n*/' },
				]
			)
		},

		'block inside inline remarks'() {
			$mol_assert_like(
				$mam_source_remarks_js_tokens( '//foo/*bar\n*/' ),
				[
					{ 0: '//foo/*bar\n', inline: '//foo/*bar\n', block: '' },
					{ 0: '*/' },
				]
			)
		},

	})

	function $mam_source_remarks_js_tokens( source: string ) {
		return [ ... source.matchAll( $mam_source_remarks_js ) ].map( token => {
			if( !token.groups ) return { 0: token[0] }
			return {
				0: token[0],
				inline: token.groups.inline ?? '',
				block: token.groups.block ?? '',
			}
		} )
	}

}
