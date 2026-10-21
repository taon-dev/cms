//#region imports
import { Routes } from '@angular/router';
import { Translation } from '@taon-dev/i18n/src';
import { adminLazyRoute as adminLazyRouteBase } from '@taon-dev/ui/src';
import { Taon } from 'taon/src';

import type { TaonAuthContextEntity } from '../decorators/taon-cms-authorization';
//#endregion

const adminLazyRoute = adminLazyRouteBase<TaonAuthContextEntity>;
const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

export const TaonCmsBackofficeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./taon-cms-backoffice.component').then(
        m => m.TaonCmsBackofficeComponent,
      ),

    children: [
      adminLazyRoute({
        isDisabled: ({ context }) => {
          // console.log('context', { context });
          return !context?.hasAccess.toManagePosts;
        },
        path: 'posts',
        menuItem: t.gettext('Posts'),
        expandable: true,
        icon: 'edit',
        loader: () =>
          import('@taon-dev/cms/src').then(m => m.TaonCmsPostsBackofficeRoutes),
      }),
      adminLazyRoute({
        isDisabled: ({ context }) => !context?.hasAccess.toManagePosts,
        path: 'assets',
        menuItem: t.gettext('Assets'),
        expandable: false,
        icon: 'perm_media',
        loader: () =>
          import('../taon-cms-assets-backoffice/taon-cms-assets-backoffice.routes').then(
            m => m.TaonCmsAssetsBackofficeRoutes,
          ),
      }),
      // adminLazyRoute({
      //   path: 'dashboard',
      //   menuItem: 'Dashboard',
      //   icon: 'dashboard',
      //   expandable: false,
      //   loader: () =>
      //     import('./anothermodule.routes').then(m => m.DashboardRoutes),
      // }),
    ],
  },
];

/**
 * By default exporting TaonCmsBackofficeRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
// export default TaonCmsBackofficeRoutes;
