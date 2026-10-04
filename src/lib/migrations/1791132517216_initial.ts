import { TaonAuthContextRepository } from '@taon-dev/session/src';
import { Taon, TaonBaseMigration, TaonMigration } from 'taon/src';
import { QueryRunner } from 'taon-typeorm/src';
import {
  MyAppAuthorization,
  MyAppGroup,
  MyAppPermission,
  MyAppRole,
} from '@taon-dev/cms/src';

//#region Migration class for context "CmsContext"
@TaonMigration({
  className: 'CmsContext_1791132517216_initial',
})
export class CmsContext_1791132517216_initial extends TaonBaseMigration {
  private taonAuthContextRepository = this.injectCustomRepo(
    TaonAuthContextRepository<MyAppAuthorization>,
  );

  //#region up
  async up(queryRunner: QueryRunner): Promise<any> {
    await queryRunner.startTransaction();
    try {
      await this.taonAuthContextRepository.persistTree({
        enums: {
          groups: MyAppGroup,
          roles: MyAppRole,
          permissions: MyAppPermission,
        },
        tree: {
          groupAndRoles: {
            [MyAppGroup.Administrator]: '*',
            [MyAppGroup.Customers]: [MyAppRole.BlogReader],
          },
          rolesAndPermissions: {
            [MyAppRole.Customer]: [
              MyAppPermission.AccessCourseP2,
              MyAppPermission.AccessCourseP2,
            ],
            [MyAppRole.CustomerPremium]: '*',
          },
        },
      });

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
    await queryRunner.startTransaction();
    try {
      await this.taonAuthContextRepository.clearRolesGroupPermissions();

      await queryRunner.commitTransaction();
    } catch (error) {
      console.error('Error in migration:', error);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }
  //#endregion
}
//#endregion
