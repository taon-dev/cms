import { ClassHelpers, TaonBaseMigration, TaonMigration } from 'taon/src';
import { QueryRunner, TableColumn } from 'taon-typeorm/src';

import { TaonCmsContentEntity } from '../taon-cms-content/taon-cms-content.entity';

@TaonMigration({ className: 'CmsContext_1793043000000_postThumbnails' })
export class CmsContext_1793043000000_postThumbnails extends TaonBaseMigration {
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = ClassHelpers.getName(TaonCmsContentEntity);
    if (!(await queryRunner.hasColumn(table, 'thumbnailKey'))) {
      await queryRunner.addColumn(
        table,
        new TableColumn({
          name: 'thumbnailKey',
          type: 'varchar',
          isNullable: true,
        }),
      );
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = ClassHelpers.getName(TaonCmsContentEntity);
    if (await queryRunner.hasColumn(table, 'thumbnailKey')) {
      await queryRunner.dropColumn(table, 'thumbnailKey');
    }
  }
}
