namespace $ {

	export class $mam_bundle_css extends $mam_bundle {

		@ $mol_mem_key
		generated( slice: $mam_slice ) {

			const start = Date.now()
			
			const prefix = slice.prefix()
			const output = slice.pack().output()

			if( prefix === 'node' ) return []

			var sources = [] as $mol_file[] // this.sourcesCSS( { path , exclude } )
			
			var target = output.resolve( `-/${prefix}.css` )
			var targetMap = output.resolve( `-/${prefix}.css.map` )
			
			// var root : any = null //$node['postcss'].root({})
			// sources.forEach(
			// 	src => {
			// 		var root2 = $node['postcss'].parse( src.content() , { from : src.path() } )
			// 		root = root ? root.append( root2 ) : root2
			// 	}
			// )
			
			// var processor = $node['postcss']([
			// 	$node[ 'postcss-custom-properties' ]({
			// 		preserve : true ,
			// 	}) ,
			// 	$node[ 'postcss-color-function' ]() ,
			// ])
			// var result = processor.process( root , { to : target.relate() , map : { inline : false } } )

			const result = {
				css : '/* CSS compiles into js bundle now! */',
				map : '/* CSS compiles into js bundle now! */',
			}
			
			target.text( result.css )
			targetMap.text( JSON.stringify( result.map , null , '\t' ) )
			
			this.log( target , Date.now() - start )
			
			return [ target , targetMap ]
		}

	}

}
