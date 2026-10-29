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
  Manager: 'manager',
};

export const TaonSessionCoreRoles = {
  ...TaonSessionCoreRolesBase,
  /**
   * Can manage roles and permissions assigned directly to users.
   * Does NOT allow changing user groups.
   */
  PostsManager: 'posts-manager',

  PremiumUser1: 'premium-user-1',
  PremiumUser2: 'premium-user-2',
};

export const TaonSessionCorePermissions = {
  ...TaonSessionCorePermissionsBase,
  ViewPrivateVideo1: 'view-private-video-1',
  ViewPrivateVideo2: 'view-private-video-2',
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
      this.context.isInGroup(TaonSessionCoreGroups.Administrator) ||
      this.context.hasRole(TaonSessionCoreRoles.PostsManager)
    );
    //#endregion
  }
}

@TaonRepository({
  className: 'TaonAuthContextRepository',
})
export class TaonAuthContextRepository extends TaonAuthContextRepositoryBase<
  TaonSessionCoreAuthorization,
  // @ts-ignore
  TaonAuthContextEntity
> {
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
          [TaonSessionCoreGroups.Manager]: [TaonSessionCoreRoles.PostsManager],
        },

        rolesAndPermissions: {
          [TaonSessionCoreRoles.AuthorizationManager]: [
            TaonSessionCorePermissions.ViewUsers,
            TaonSessionCorePermissions.ViewUserAuthorization,
            TaonSessionCorePermissions.ManageUserRoles,
            TaonSessionCorePermissions.ManageUserPermissions,
          ],
          [TaonSessionCoreRoles.PostsManager]: [],
          [TaonSessionCoreRoles.PremiumUser1]: [
            TaonSessionCorePermissions.ViewPrivateVideo1,
          ],
          [TaonSessionCoreRoles.PremiumUser2]: [
            TaonSessionCorePermissions.ViewPrivateVideo2,
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
