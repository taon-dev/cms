//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoute } from '@taon-dev/ui/src';
//#endregion

export const TaonCmsWebsiteFeaturesRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./taon-cms-website-features.component').then(m => m.TaonCmsWebsiteFeaturesComponent),

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
 * By default exporting TaonCmsWebsiteFeaturesRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
// export default TaonCmsWebsiteFeaturesRoutes;