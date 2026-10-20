//#region taon auth decorator

import { MIGRATIONS_CLASSES_FOR_SessionContext } from '@taon-dev/session/src';
import {
  TaonAuthContextEntity as TaonAuthContextEntityBase,
  TaonAuthContextHasAccess as TaonAuthContextHasAccessBase,
  TaonSessionCoreAuthorization as TaonSessionCoreAuthorizationBase,
  TaonSessionCoreGroups as TaonSessionCoreGroupsBase,
  TaonSessionCorePermissions as TaonSessionCorePermissionsBase,
  TaonSessionCoreRoles as TaonSessionCoreRolesBase,
  TaonAuthContextRepository as TaonAuthContextRepositoryBase,
} from '@taon-dev/session/src';
import { TaonEntity, TaonMigration, TaonRepository } from 'taon/src';

export const TaonSessionCoreGroups = {
  ...TaonSessionCoreGroupsBase,
  TestPostsManager: 'test-posts-managers',
};

export const TaonSessionCoreRoles = {
  ...TaonSessionCoreRolesBase,
  TestEditor: 'test-editor',
};

export const TaonSessionCorePermissions = {
  ...TaonSessionCorePermissionsBase,
};

export interface TaonSessionCoreAuthorization extends TaonSessionCoreAuthorizationBase {
  groups: typeof TaonSessionCoreGroups;
  roles: typeof TaonSessionCoreRoles;
  permissions: typeof TaonSessionCorePermissions;
}

@TaonEntity<TaonAuthContextEntity>({
  className: 'TaonAuthContextEntity',
  createTable: false,
})
export class TaonAuthContextEntity extends TaonAuthContextEntityBase {
  declare snapshoot: Partial<TaonAuthContextHasAccess>;

  // @ts-ignore
  get hasAccess(): TaonAuthContextHasAccess {
    return this.injectClass<TaonAuthContextHasAccess, [TaonAuthContextEntity]>(
      TaonAuthContextHasAccess as any,
      this,
    ) as any;
  }
}

export class TaonAuthContextHasAccess extends TaonAuthContextHasAccessBase {
  // @ts-ignore
  declare protected context: TaonAuthContextEntity;

  get toManagePosts(): boolean {
    //#region @browserFunc
    return this.context.snapshoot.toManagePosts;
    //#endregion
    //#region @websqlFunc
    return (
      this.context.isSuperUser ||
      this.context.isInGroup(TaonSessionCoreGroups.TestPostsManager)
    );
    //#endregion
  }
}

@TaonRepository({
  className: 'TaonAuthContextRepository',
})
export class TaonAuthContextRepository extends TaonAuthContextRepositoryBase<TaonSessionCoreAuthorization> {
  // @ts-ignore
  entityClassResolveFn = () => TaonAuthContextEntity;
}

@TaonMigration({
  className: 'CmsContext_1791132517217_initial',
})
export class CmsContext_1791132517217_initial
  extends MIGRATIONS_CLASSES_FOR_SessionContext.SessionContext_1791132517216_initial
{
  protected async persistTree(): Promise<void> {
    //#region @websqlFunc
    await this.taonAuthContextRepository.persistTree({
      authorization: {
        groups: TaonSessionCoreGroups,
        roles: TaonSessionCoreRoles,
        permissions: TaonSessionCorePermissions,
      },

      tree: {
        groupAndRoles: {
          // Administrators receive all core administrative roles.
          [TaonSessionCoreGroups.Administrator]: '*',

          // Normal customers receive no administrative roles by default.
          [TaonSessionCoreGroups.Customers]: [],
          // Normal customers receive no administrative roles by default.
          [TaonSessionCoreGroups.TestPostsManager]: [
            TaonSessionCoreRoles.TestEditor,
          ],
        },

        rolesAndPermissions: {
          [TaonSessionCoreRoles.AuthorizationManager]: [
            TaonSessionCorePermissions.ViewUsers,
            TaonSessionCorePermissions.ViewUserAuthorization,
            TaonSessionCorePermissions.ManageUserRoles,
            TaonSessionCorePermissions.ManageUserPermissions,
          ],

          [TaonSessionCoreRoles.UserManager]: [
            TaonSessionCorePermissions.ViewUsers,
            TaonSessionCorePermissions.ManageUsers,
            TaonSessionCorePermissions.ViewSessions,
            TaonSessionCorePermissions.RevokeSessions,
          ],
        },
      },
    });
    //#endregion
  }
}
//#endregion
