namespace $ {

	/** Building MAM package */
	export class $mam_package extends $mol_object2 {

		@ $mol_mem
		root() {
			return undefined as any as $mam_root
		}

		@ $mol_mem
		dir() {
			return undefined as any as $mol_file
		}

		@ $mol_mem
		output( next? : $mol_file ) {
			return this.dir().resolve( '-' )
		}

		@ $mol_mem_key
		slice< Slice extends typeof $mam_slice >( Slice : Slice ) {
			const slice = new Slice
			slice.pack = $mol_const( this )
			return slice as InstanceType< Slice >
		}

		@ $mol_mem
		slices() {
			return [
				this.slice( this.$.$mam_slice_web_prod ) ,
				this.slice( this.$.$mam_slice_node_prod ) ,
				this.slice( this.$.$mam_slice_web_test ) ,
				this.slice( this.$.$mam_slice_node_test ) ,
			]
		}

		@ $mol_mem
		bundles_generated() {
			const files = new Set< $mol_file >()

			for (const slice of this.slices()) {
				for (const file of slice.bundles_generated()) {
					files.add( file )
				}
			}

			return files
		}

		@ $mol_mem
		meta() {
			const decls = [] as $mol_tree[]

			for( const file of this.dir().sub() ) {
				if( !/\.meta\.tree$/.test( file.name() ) ) continue

				const tree = this.root().source( this.$.$mam_source_meta_tree ).tree( file )

				decls.push( ... tree.sub )
			}
			
			return new $mol_tree({ sub : decls })
		}

		@ $mol_mem
		ensure() {

			const mod = this.dir()
			
			const parent = mod.parent()
			const root_dir = this.root().dir()
			
			if( mod !== this.dir() ) this.root().pack( parent ).ensure()
			
			var mapping = mod === root_dir
				? $mol_tree.fromString( `pack ${ mod.name() } git \\https://github.com/hyoo-ru/mam.git\n` )
				: this.meta()
			
			if( mod.exists() ) {

				try {

					if( mod.type() !== 'dir' ) return false
					
					const git_dir = mod.resolve( '.git' )
					if( git_dir.exists() ) {
						
						this.$.$mol_exec( mod.path() , 'git' , 'pull', '--deepen=1' )
						// mod.reset()
						// for ( const sub of mod.sub() ) sub.reset()
						
						return false
					}
					
					for( let repo of mapping.select( 'pack' , mod.name() , 'git' ).sub ) {
						
						this.$.$mol_exec( mod.path() , 'git' , 'init' )
						
						const res = this.$.$mol_exec( mod.path() , 'git' , 'remote' , 'show' , repo.value )
						const matched = res.stdout.toString().match( /HEAD branch: (.*?)\n/ )
						const head_branch_name = res instanceof Error || matched === null || !matched[1]
							? 'master'
							: matched[1]
						
						this.$.$mol_exec( mod.path() , 'git' , 'remote' , 'add' , '--track' , head_branch_name! , 'origin' , repo.value )
						this.$.$mol_exec( mod.path() , 'git' , 'pull', '--deepen=1' )
						mod.reset()
						for ( const sub of mod.sub() ) {
							sub.reset()
						}
						return true
					}

				} catch( error: any ) {

					this.$.$mol_log3_fail({
						place: `${this}.modEnsure()` ,
						path: mod.path() ,
						message: error.message ,
					})

				}

				return false
			}

			for( let repo of mapping.select( 'pack' , mod.name() , 'git' ).sub ) {
				this.$.$mol_exec( root_dir.path() , 'git' , 'clone' , '--depth', '1', repo.value , mod.relate( root_dir ) )
				mod.reset()
				return true
			}
			
			if( parent === root_dir ) {
				throw new Error( `Root package "${ mod.relate( root_dir ) }" not found` )
			}

			if(
				!mod.name().startsWith('@')
				&& (
					parent.name() === 'node_modules'
					|| ( parent === root_dir.resolve( 'node' ) )&&( mod.name() !== 'node' )
				)
			) {
				$node[ mod.name() ] // force autoinstall through npm
			}

			// Handle npm packages with names @hello/world
			if (parent.name().startsWith('@') && parent.parent().name() === 'node_modules') {
				$node [ `${parent.name()}/${mod.name()}` ]
			}

			return false
		}

	}

}
