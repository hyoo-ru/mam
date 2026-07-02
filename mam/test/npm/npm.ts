namespace $ {

	export function $mam_test_npm_parsed() {
		return $npm[ 'yaml' ].parse( 'mam: 1' ) as { mam: number }
	}

}
