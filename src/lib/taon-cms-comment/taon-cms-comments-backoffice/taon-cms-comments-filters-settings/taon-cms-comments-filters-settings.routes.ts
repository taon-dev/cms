//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoute } from '@taon-dev/ui/src';
//#endregion

export const TaonCmsCommentsFiltersSettingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./taon-cms-comments-filters-settings.component').then(m => m.TaonCmsCommentsFiltersSettingsComponent),

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
 * By default exporting TaonCmsCommentsFiltersSettingsRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
// export default TaonCmsCommentsFiltersSettingsRoutes;