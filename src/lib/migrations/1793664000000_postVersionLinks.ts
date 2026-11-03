import { TaonCmsContentEntity } from '../taon-cms-content/taon-cms-content.entity';
import { ClassHelpers, TaonBaseMigration, TaonMigration } from 'taon/src';
import { QueryRunner, TableColumn } from 'taon-typeorm/src';

@TaonMigration({
  className: 'CmsContext_1793664000000_postVersionLinks',
})
export class CmsContext_1793664000000_postVersionLinks extends TaonBaseMigration {
  async up(queryRunner: QueryRunner): Promise<void> {
    const table = ClassHelpers.getName(TaonCmsContentEntity);
    for (const name of ['publicVersionPostId', 'privateVersionPostId']) {
      if (!(await queryRunner.hasColumn(table, name))) {
        await queryRunner.addColumn(
          table,
          new TableColumn({
            name,
            type: 'integer',
            isNullable: true,
          }),
        );
      }
    }
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    const table = ClassHelpers.getName(TaonCmsContentEntity);
    for (const name of ['privateVersionPostId', 'publicVersionPostId']) {
      if (await queryRunner.hasColumn(table, name)) {
        await queryRunner.dropColumn(table, name);
      }
    }
  }
}
