namespace $ {

	/** MAM Root of all sources. */
	export class $mam_root extends $mol_object2 {

		@ $mol_mem
		dir() {
			return this.$.$mol_file.relative( '.' )
		}

		// Реестр плагинов. Свой сборщик = наследник с расширенными списками,
		// подключается через контекст: $.$mam_root = $my_root

		@ $mol_mem
		slice_classes(): ( typeof $mam_slice )[] {
			return [
				this.$.$mam_slice_web_prod,
				this.$.$mam_slice_node_prod,
				this.$.$mam_slice_web_test,
				this.$.$mam_slice_node_test,
			]
		}

		@ $mol_mem
		source_classes(): ( typeof $mam_source )[] {
			return [
				this.$.$mam_source_dir,
				this.$.$mam_source_js,
				this.$.$mam_source_css,
				this.$.$mam_source_view_tree,
				this.$.$mam_source_view_ts,
				this.$.$mam_source_ts,
				this.$.$mam_source_meta_tree,
			]
		}

		@ $mol_mem
		convert_classes(): ( typeof $mam_convert )[] {
			return [
				this.$.$mam_convert_meta_tree,
				this.$.$mam_convert_view_tree,
				this.$.$mam_convert_glsl,
				this.$.$mam_convert_css,
				this.$.$mam_convert_bin,
				this.$.$mam_convert_ts,
				this.$.$mam_convert_npm,
			]
		}

		@ $mol_mem
		bundle_classes(): ( typeof $mam_bundle )[] {
			return [
				this.$.$mam_bundle_meta,
				this.$.$mam_bundle_js,
				this.$.$mam_bundle_mjs,
				this.$.$mam_bundle_baza,
				this.$.$mam_bundle_view_tree,
				this.$.$mam_bundle_meta_tree,
				this.$.$mam_bundle_locale,
				this.$.$mam_bundle_index_html,
				this.$.$mam_bundle_package_json,
				this.$.$mam_bundle_manifest_json,
				this.$.$mam_bundle_readme,
				this.$.$mam_bundle_files,
				this.$.$mam_bundle_cordova,
			]
		}

		@ $mol_mem
		bundle_test_classes(): ( typeof $mam_bundle )[] {
			return [
				this.$.$mam_bundle_test_js,
				this.$.$mam_bundle_test_html,
				this.$.$mam_bundle_audit_js,
				this.$.$mam_bundle_dts,
			]
		}

		@ $mol_mem_key
		pack( dir: $mol_file ) {
			const pack = new this.$.$mam_package
			pack.root = $mol_const( this )
			pack.dir = $mol_const( dir )

			pack.ensure()
			
			return pack
		}

		@ $mol_mem
		ensure() {
			const ensure = new this.$.$mam_ensure
			ensure.root = $mol_const( this )
			return ensure
		}

		@ $mol_mem_key
		source< Source extends typeof $mam_source >( [ Source, file ]: [ Source, $mol_file ] ) {
			if( !Source.match( file ) ) return null
			
			const source = new Source
			source.root = $mol_const( this )
			source.file = $mol_const( file )
			return source as InstanceType< Source >
		}

		@ $mol_mem_key
		convert< Convert extends typeof $mam_convert >( [ Convert, file ]: [ Convert, $mol_file ] ) {
			if( !Convert.match( file ) ) return null
			
			const convert = new Convert
			convert.root = $mol_const( this )
			convert.source = $mol_const( file )
			return convert as InstanceType< Convert >
		}

		@ $mol_mem_key
		bundle< Bundle extends typeof $mam_bundle >( Bundle: Bundle ) {
			const bundle = new Bundle
			bundle.root = $mol_const( this )
			return bundle as InstanceType< Bundle >
		}

		@ $mol_mem
		ts_options() {
			const rawOptions = JSON.parse( this.dir().resolve( 'tsconfig.json' ).text() + '').compilerOptions
			const res = $node.typescript.convertCompilerOptionsFromJson( rawOptions, ".", 'tsconfig.json' )
			if( res.errors.length ) throw res.errors
			return res.options
		}

	}

}
