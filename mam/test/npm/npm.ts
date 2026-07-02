namespace $ {

	const yaml = $npm[ 'yaml' ]
	const { parse } = $npm[ 'yaml' ]

	export function $mam_test_npm_parsed() {
		return {
			... parse( 'mam: 1' ) as { mam: number },
			... yaml.parse( 'mol: 2' ) as { mol: number },
		}
	}

}
