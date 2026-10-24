//#region imports
import { Routes } from '@angular/router';
import type { TaonAuthContextEntity } from '@taon-dev/cms/src';
import { Translation } from '@taon-dev/i18n/src';
import { adminLazyRoute as adminLazyRouteBase } from '@taon-dev/ui/src';
import { Taon } from 'taon/src';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

const adminLazyRoute = adminLazyRouteBase<TaonAuthContextEntity>;

//#endregion

export const TaonBaselineBackofficeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./taon-baseline-backoffice.component').then(
        m => m.TaonBaselineBackofficeComponent,
      ),

    children: [
      adminLazyRoute({
        isVisible: ({ context }) =>
          context?.isSuperUser || context?.isLocalhostBackend,
        path: 'sudo',
        menuItem: t.gettext('Sudo'),
        color: 'red',
        icon: 'supervisor_account',
        expandable: true,
        loader: () =>
          import('@taon-dev/sudo/src').then(m => m.TaonSudoBackofficeRoutes),
      }),
      adminLazyRoute({
        path: 'cms',
        menuItem: t.gettext('CMS'),
        expandable: true,
        icon: 'content_copy',
        loader: () =>
          import('@taon-dev/cms/src').then(m => m.TaonCmsBackofficeRoutes),
      }),
      adminLazyRoute({
        isDisabled: ({ context }) => !context?.hasAccess.toViewUsers,
        path: 'users',
        menuItem: t.gettext('Users'),
        icon: 'manage_accounts',
        expandable: false,
        loader: () =>
          import('@taon-dev/session/src').then(
            m => m.TaonSessionBackofficeUsersRoutes,
          ),
      }),
      adminLazyRoute({
        isDisabled: ({ context }) => !context?.hasAccess.toViewSessions,
        path: 'session',
        menuItem: t.gettext('Sessions'),
        expandable: false,
        icon: 'login',
        loader: () =>
          import('@taon-dev/session/src').then(
            m => m.TaonSessionBackofficeRoutes,
          ),
      }),
      adminLazyRoute({
        isDisabled: ({ context }) => !context?.hasAccess.toViewAuthorization,
        path: 'authorization',
        menuItem: t.gettext('Authorization'),
        icon: 'apps',
        expandable: true,
        loader: () =>
          import('@taon-dev/session/src').then(
            m => m.TaonAuthorizationBackofficeRoutes,
          ),
      }),
      adminLazyRoute({
        isDisabled: ({ context }) => !context?.hasAccess.toViewEmail,
        path: 'emails',
        menuItem: t.gettext('Emails'),
        expandable: false,
        icon: 'email',
        loader: () =>
          import('@taon-dev/emails/src').then(
            m => m.TaonEmailsBackofficeRoutes,
          ),
      }),
    ],
  },
];

/**
 * By default exporting TaonBaselineBackofficeRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
// export default TaonBaselineBackofficeRoutes;
