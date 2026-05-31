namespace $ {

	/**
	 * Operation-файл может ссылаться на типы из внешней схемы лежащей в одном
	 * из родительских модулей (`*.schema.gql`). Добавляем все найденные выше
	 * по дереву схема-файлы как зависимости графа.
	 */
	export class $mam_source_gql extends $mam_source {

		static match( file: $mol_file ): boolean {
			return /\.(gql|graphql)$/.test( file.name() )
		}

		static schema_regex = /\.schema\.(gql|graphql)$/

		@ $mol_mem
		deps() {
			const deps = super.deps()

			const file = this.file()
			if( $mam_source_gql.schema_regex.test( file.name() ) ) return deps

			const root_dir = this.root().dir()
			const root_depth = root_dir.path().split( '/' ).length
			let dir = file.parent()

			while( dir.path().split( '/' ).length >= root_depth ) {
				for( const sub of dir.sub() ) {
					if( sub === file ) continue
					if( sub.type() !== 'file' ) continue
					if( !$mam_source_gql.schema_regex.test( sub.name() ) ) continue
					deps.set( sub, 0 )
				}
				if( dir === root_dir ) break
				dir = dir.parent()
			}

			return deps
		}

	}

}
