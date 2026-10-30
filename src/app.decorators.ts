//#region imports
import {
  CmsContext_1792506757808_applicaitonHooks,
  TaonCmsContentProvider,
} from '@taon-dev/cms/src';
import { TaonECommerceCartProvider } from '@taon-dev/e-commerce/src';
import { TaonECommerceEntitlementEntity } from '@taon-dev/e-commerce/src';
import { entitlementHasAccess } from '@taon-dev/e-commerce/src';
import { getTaonECommerceProductEffectivePermissions } from '@taon-dev/e-commerce/src';
import { SessionContext_1791132517216_initial } from '@taon-dev/session/src';
import { TaonSessionProvider } from '@taon-dev/session/src';
import {
  TaonAuthContextEntity as TaonAuthContextEntityBase,
  TaonAuthContextHasAccess as TaonAuthContextHasAccessBase,
  TaonSessionCoreAuthorization as TaonSessionCoreAuthorizationBase,
  TaonSessionCoreGroups as TaonSessionCoreGroupsBase,
  TaonSessionCorePermissions as TaonSessionCorePermissionsBase,
  TaonSessionCoreRoles as TaonSessionCoreRolesBase,
  TaonAuthContextRepository as TaonAuthContextRepositoryBase,
} from '@taon-dev/session/src';
import { TaonEntity, TaonRepository } from 'taon/src';
import { TaonProvider, TaonMigration } from 'taon/src';

// @placeholder-for-imports

import { TaonCmsApplicationHookDecorator } from './app.hooks';
import {
  ENV_ANGULAR_NODE_APP_CONFIG_ACCESS_TOKEN_SECRET,
  ENV_ANGULAR_NODE_APP_CONFIG_GOOGLE_CLIENT_ID,
  ENV_ANGULAR_NODE_APP_CONFIG_GOOGLE_SECRET,
  ENV_ANGULAR_NODE_APP_CONFIG_REFRESH_TOKEN_SECRET,
  ENV_ANGULAR_NODE_APP_CONFIG_SUPER_USERS,
  ENV_ANGULAR_NODE_APP_WEBSITE_TITLE,
} from './lib/env/env.angular-node-app';
//#endregion

const DEFAULT_EMAIL = 'darekf77@gmail.com';

//#region taon sesssion providers decorator
@TaonProvider({
  className: 'TaonSessionProvider',
})
export class TaonSessionProviderDecorator extends TaonSessionProvider {
  constructor() {
    super();
    this.socialLogin.google.enabled = true;
    this.socialLogin.google.googleClientId =
      ENV_ANGULAR_NODE_APP_CONFIG_GOOGLE_CLIENT_ID;

    // TODO @REMOVE_THIS this is waiting for emails implementation
    this.linkSocialAccountEmail = true;
  }

  async _() {
    //#region @backend
    const googleSecret = await ENV_ANGULAR_NODE_APP_CONFIG_GOOGLE_SECRET();
    this.socialLogin.google.googleSecret = googleSecret;

    this.superUsersEmails = [
      // DEFAULT_EMAIL,
      ...(await ENV_ANGULAR_NODE_APP_CONFIG_SUPER_USERS()).split(','),
    ];

    console.log('active super users', this.superUsersEmails);

    this.cookies.ACCESS_TOKEN_SECRET =
      await ENV_ANGULAR_NODE_APP_CONFIG_ACCESS_TOKEN_SECRET();

    this.cookies.REFRESH_TOKEN_SECRET =
      await ENV_ANGULAR_NODE_APP_CONFIG_REFRESH_TOKEN_SECRET();
    //#endregion

    // console.log('is localhost', this.isLocalhost);

    if (this.isLocalhost) {
      this.login.defaultEmail = DEFAULT_EMAIL;
      this.login.diableLoginByEmail = false;
    } else {
      this.login.diableLoginByEmail = true;
    }

    await super._();
  }
}
//#endregion

//#region authorization decorators

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

  AccessP1User: 'access-p1-user',
  AccessP2User: 'access-p2-user',
  AccessP3User: 'access-p3-user',
};

export const TaonSessionCorePermissions = {
  ...TaonSessionCorePermissionsBase,
  PermissionToAccessP1: 'permission-to-access-p1',
  PermissionToAccessP2: 'permission-to-access-p2',
  PermissionToAccessP3: 'permission-to-access-p3',
};

export interface TaonSessionCoreAuthorization extends TaonSessionCoreAuthorizationBase {
  groups: typeof TaonSessionCoreGroups;
  roles: typeof TaonSessionCoreRoles;
  permissions: typeof TaonSessionCorePermissions;
}

@TaonEntity<TaonAuthContextEntityDecorator>({
  className: 'TaonAuthContextEntity',
  createTable: false,
})
export class TaonAuthContextEntityDecorator extends TaonAuthContextEntityBase {
  declare snapshoot: Partial<TaonAuthContextHasAccess>;

  // @ts-ignore
  get hasAccess(): TaonAuthContextHasAccess {
    return this.injectClass<
      TaonAuthContextHasAccess,
      [TaonAuthContextEntityDecorator]
    >(TaonAuthContextHasAccess as any, this) as any;
  }
}

export class TaonAuthContextHasAccess extends TaonAuthContextHasAccessBase {
  // @ts-ignore
  declare protected context: TaonAuthContextEntityDecorator;

  get toManagePosts(): boolean {
    //#region @browserFunc
    return !!this.context.snapshoot.toManagePosts;
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
export class TaonAuthContextRepositoryDecorator extends TaonAuthContextRepositoryBase<
  TaonSessionCoreAuthorization,
  // @ts-ignore
  TaonAuthContextEntityDecorator
> {
  // @ts-ignore
  entityClassResolveFn = () => TaonAuthContextEntityDecorator;
}

@TaonMigration({
  className: 'SessionContext_1791132517217_initial_decorator',
})
export class SessionContext_1791132517217_initial_decorator extends SessionContext_1791132517216_initial {
  protected async persistTree(): Promise<void> {
    //#region @websqlFunc

    console.info(`Migrating CUSTOM authorization`);

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
          [TaonSessionCoreRoles.AccessP1User]: [
            TaonSessionCorePermissions.PermissionToAccessP1,
          ],
          [TaonSessionCoreRoles.AccessP2User]: [
            TaonSessionCorePermissions.PermissionToAccessP2,
          ],
          [TaonSessionCoreRoles.AccessP3User]: [
            TaonSessionCorePermissions.PermissionToAccessP2,
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

//#region cms decorators
@TaonProvider({
  className: 'TaonCmsContentProvider',
})
export class TaonCmsContentProviderDecorator extends TaonCmsContentProvider {
  async _(): Promise<void> {
    this.siteName = ENV_ANGULAR_NODE_APP_WEBSITE_TITLE;
    await super._();
  }
}
//#endregion

//#region applicaiton hooks

@TaonMigration({
  className: 'CmsContext_1792506757808_applicaitonHooks',
})
export class CmsContext_1792506757808_applicaitonHooks_decorator extends CmsContext_1792506757808_applicaitonHooks {
  protected getApplicationHooks(): Record<string, string> {
    return TaonCmsApplicationHookDecorator;
  }
}
//#endregion
