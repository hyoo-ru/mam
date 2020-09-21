namespace $ {
	export function $mam_test_assert< Value >( a : Value , b : Value ) {
		console.assert( a == b , `Not equal \n${ a }\n${ b }` )
	}
}
