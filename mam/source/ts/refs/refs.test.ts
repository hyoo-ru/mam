namespace $ {
	$mol_test({

		'underscored fqn'() {
			$mol_assert_like(
				[ ... $mam_source_ts_refs.parse( '[$'+'123_foo_bar]' ) ] ,
				[
					{ 0 : '[' },
					{
						string : '' ,
						fqn : '$'+'123_foo_bar' ,
						name : '123_foo_bar' ,
						req : '' ,
						path : '' ,
					},
					{ 0 : ']' },
				]
			)
		},

		'dotted fqn'() {
			$mol_assert_like(
				[ ... $mam_source_ts_refs.parse( '[$'+'123.foo.bar]' ) ] ,
				[
					{ 0 : '[' },
					{
						string : '' ,
						fqn : '$'+'123.foo.bar' ,
						name : '123.foo.bar' ,
						req : '' ,
						path : '' ,
					},
					{ 0 : ']' },
				]
			)
		},

		'mixed fqn types'() {
			$mol_assert_like(
				[ ... $mam_source_ts_refs.parse( '[$'+'123_foo.bar_lol]' ) ] ,
				[
					{ 0 : '[' },
					{
						string : '' ,
						fqn : '$'+'123_foo.bar_lol' ,
						name : '123_foo.bar_lol' ,
						req : '' ,
						path : '' ,
					},
					{ 0 : ']' },
				]
			)
		},

		'fqn in string'() {
			$mol_assert_like(
				[ ... $mam_source_ts_refs.parse( '["$'+'123_foo_bar"]' ) ] ,
				[
					{ 0 : '[' },
					{
						string : '"$'+'123_foo_bar"' ,
						fqn : '' ,
						name : '' ,
						req : '' ,
						path : '' ,
					},
					{ 0 : ']' },
				]
			)
		},

		'single quote require'() {
			$mol_assert_like(
				[ ... $mam_source_ts_refs.parse( '[require '+"( 'path/to.file' )]" ) ] ,
				[
					{ 0 : '[' },
					{
						string : '' ,
						fqn : '' ,
						name : '' ,
						req : 'require '+"( 'path/to.file' )" ,
						path : 'path/to.file' ,
					},
					{ 0 : ']' },
				]
			)
		},

		'double quote require'() {
			$mol_assert_like(
				[ ... $mam_source_ts_refs.parse( '[require '+'( "path/to.file" )]' ) ] ,
				[
					{ 0 : '[' },
					{
						string : '' ,
						fqn : '' ,
						name : '' ,
						req : 'require '+'( "path/to.file" )' ,
						path : 'path/to.file' ,
					},
					{ 0 : ']' },
				]
			)
		},

		'require in string'() {
			$mol_assert_like(
				[ ... $mam_source_ts_refs.parse( `["require `+`( 'path/to.file' )"]` ) ] ,
				[
					{ 0 : '[' },
					{
						string : `"require `+`( 'path/to.file' )"` ,
						fqn : '' ,
						name : '' ,
						req : '' ,
						path : '' ,
					},
					{ 0 : ']' },
				]
			)
		},

	})
}
