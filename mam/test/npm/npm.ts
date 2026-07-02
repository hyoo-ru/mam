namespace $ {

	export function $mam_test_npm_parsed() {
		return $node[ 'yaml' ].parse( 'mam: 1' ) as { mam: number }
	}

}
