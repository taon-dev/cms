import { ClassHelpers, TaonBaseMigration, TaonMigration } from 'taon/src';
import { QueryRunner, TableColumn } from 'taon-typeorm/src';

import { TaonCmsContentEntity } from '../taon-cms-content/taon-cms-content.entity';

@TaonMigration({
  className: 'CmsContext_1792579000000_postPermissionInheritance',
})
export class CmsContext_1792579000000_postPermissionInheritance extends TaonBaseMigration {
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = ClassHelpers.getName(TaonCmsContentEntity);
    if (
      !(await queryRunner.hasColumn(table, 'applyPermissionsToRelatedPosts'))
    ) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'applyPermissionsToRelatedPosts',
          type: 'boolean',
          default: false,
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = ClassHelpers.getName(TaonCmsContentEntity);
    if (await queryRunner.hasColumn(table, 'applyPermissionsToRelatedPosts')) {
      await queryRunner.dropColumn(table, 'applyPermissionsToRelatedPosts');
    }
  }
}
