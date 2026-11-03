//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoute } from '@taon-dev/ui/src';
//#endregion

export const TaonCmsCommentsAllPreviewBackofficeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./taon-cms-comments-all-preview-backoffice.component').then(m => m.TaonCmsCommentsAllPreviewBackofficeComponent),

    children: [
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
 * By default exporting TaonCmsCommentsAllPreviewBackofficeRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
// export default TaonCmsCommentsAllPreviewBackofficeRoutes;