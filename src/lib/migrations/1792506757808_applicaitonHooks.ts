import { Taon, TaonBaseMigration, TaonMigration } from 'taon/src';
import { QueryRunner } from 'taon-typeorm/src';

//#region Migration class for context "CmsContext"
@TaonMigration({
  className: 'CmsContext_1792506757808_applicaitonHooks',
})
export class CmsContext_1792506757808_applicaitonHooks extends TaonBaseMigration {
  //#region up
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.startTransaction();
    try {
      // do "something" in db

      await queryRunner.commitTransaction();
    } catch (error) {
      console.error('Error in migration:', error);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
  //#endregion

  //#region down
  async down(queryRunner: QueryRunner): Promise<any> {
    // revert this "something" in db
    // await queryRunner.clearDatabase()
  }
  //#endregion
}
//#endregion
