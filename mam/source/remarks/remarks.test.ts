namespace $ {
	$mol_test({

		// 'code without remarks'() {
		// 	$mol_assert_like(
		// 		[ ... $mam_source_ts_remarks.parse( 'foo\nbar' ) ] ,
		// 		[
		// 			{ 0 : 'foo\nbar' },
		// 		]
		// 	)
		// },

		// 'inline remarks'() {
		// 	$mol_assert_like(
		// 		[ ... $mam_source_ts_remarks.parse( 'foo//bar\nlol' ) ] ,
		// 		[
		// 			{ 0 : 'foo' },
		// 			{ inline : '//bar\n' , block : '' },
		// 			{ 0 : 'lol' },
		// 		]
		// 	)
		// },

		// 'block remarks'() {
		// 	$mol_assert_like(
		// 		[ ... $mam_source_ts_remarks.parse( 'foo/*bar\nlol*/xxx' ) ] ,
		// 		[
		// 			{ 0 : 'foo' },
		// 			{ inline : '' , block : '/*bar\nlol*/' },
		// 			{ 0 : 'xxx' },
		// 		]
		// 	)
		// },

		// 'inline inside block remarks'() {
		// 	$mol_assert_like(
		// 		[ ... $mam_source_ts_remarks.parse( '/*foo//bar*/\n*/' ) ] ,
		// 		[
		// 			{ inline : '' , block : '/*foo//bar*/' },
		// 			{ 0 : '\n*/' },
		// 		]
		// 	)
		// },

		// 'block inside inline remarks'() {
		// 	$mol_assert_like(
		// 		[ ... $mam_source_ts_remarks.parse( '//foo/*bar\n*/' ) ] ,
		// 		[
		// 			{ inline : '//foo/*bar\n' , block : '' },
		// 			{ 0 : '*/' },
		// 		]
		// 	)
		// },

	})
}
