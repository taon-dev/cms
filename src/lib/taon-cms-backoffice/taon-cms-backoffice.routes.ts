//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoute } from '@taon-dev/ui/src';
//#endregion

export const TaonCmsBackofficeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./taon-cms-backoffice.component').then(
        m => m.TaonCmsBackofficeComponent,
      ),

    children: [
      adminLazyRoute({
        path: 'posts',
        menuItem: 'Posts',
        expandable: true,
        icon: 'edit',
        loader: () =>
          import('@taon-dev/cms/src').then(m => m.TaonCmsPostsBackofficeRoutes),
      }),
      adminLazyRoute({
        path: 'assets',
        menuItem: 'Assets',
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
