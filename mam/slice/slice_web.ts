namespace $ {

	export class $mam_slice_web extends $mam_slice {

		filter( file : $mol_file ) {
			if( !super.filter( file ) ) return false
			if( /\.node\./.test( file.name() ) ) return false
			return true
		}

		prefix() {
			return 'web'
		}

	}

	export class $mam_slice_web_prod extends $mam_slice_web {

		filter( file : $mol_file ) {
			if( !super.filter( file ) ) return false
			if( /\.test\./.test( file.name() ) ) return false
			return true
		}
		
	}

	export class $mam_slice_web_test extends $mam_slice_web {

		prefix() {
			return 'web.test'
		}

		@ $mol_mem
		bundle_classes() {
			return [
				this.$.$mam_bundle_js,
				this.$.$mam_bundle_dts,
			]
		}

		@ $mol_mem
		files() {
			
			const all = super.files()
			const prod = this.pack().slice( this.$.$mam_slice_web_prod ).files()
			
			const test = new Set< $mol_file >()

			for( const file of all ) {
				if( prod.has( file ) ) continue
				test.add( file )
			}

			return test
		}

	}

}
