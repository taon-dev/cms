import { TaonCmsContentEntity } from '../taon-cms-content/taon-cms-content.entity';
import { ClassHelpers, TaonBaseMigration, TaonMigration } from 'taon/src';
import { QueryRunner, Table } from 'taon-typeorm/src';

import { TaonCmsApplicationHookEntity } from '../taon-cms-application-hook/taon-cms-application-hook.entity';
import { TaonCmsApplicationHook } from '../taon-cms-application-hooks';

//#region Migration class for context "CmsContext"
@TaonMigration({
  className: 'CmsContext_1792506757808_applicaitonHooks',
})
export class CmsContext_1792506757808_applicaitonHooks extends TaonBaseMigration {
  APPLICATION_HOOK_TABLE = ClassHelpers.getName(TaonCmsApplicationHookEntity);

  CONTENT_TABLE = ClassHelpers.getName(TaonCmsContentEntity);

  //#region up
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.startTransaction();
    try {
      if (!(await queryRunner.hasTable(this.APPLICATION_HOOK_TABLE))) {
        await queryRunner.createTable(
          new Table({
            name: this.APPLICATION_HOOK_TABLE,
            columns: [
              {
                name: 'id',
                type: 'integer',
                isPrimary: true,
                isGenerated: true,
                generationStrategy: 'increment',
              },
              { name: 'hook', type: 'varchar', isUnique: true },
              {
                name: 'contentId',
                type: 'integer',
                isNullable: true,
                isUnique: true,
              },
            ],
            foreignKeys: [
              {
                columnNames: ['contentId'],
                referencedTableName: this.CONTENT_TABLE,
                referencedColumnNames: ['id'],
                onDelete: 'SET NULL',
              },
            ],
          }),
          true,
        );
      }

      await this.persistApplicationHooks(queryRunner);
      await queryRunner.commitTransaction();
    } catch (error) {
      console.error('Error in migration:', error);
      await queryRunner.rollbackTransaction();
      throw error;
    }
  }
  //#endregion

  //#region down
  async down(queryRunner: QueryRunner): Promise<any> {
    if (await queryRunner.hasTable(this.APPLICATION_HOOK_TABLE)) {
      await queryRunner.dropTable(this.APPLICATION_HOOK_TABLE, true);
    }
  }
  //#endregion

  protected getApplicationHooks(): Record<string, string> {
    return TaonCmsApplicationHook;
  }

  private async persistApplicationHooks(
    queryRunner: QueryRunner,
  ): Promise<void> {
    const repository = queryRunner.manager.getRepository(
      TaonCmsApplicationHookEntity,
    );
    for (const hook of Object.values(this.getApplicationHooks())) {
      if (!(await repository.findOneBy({ hook: hook as any }))) {
        await repository.save(
          repository.create({ hook: hook as any, contentId: null }),
        );
      }
    }
  }
}
//#endregion
