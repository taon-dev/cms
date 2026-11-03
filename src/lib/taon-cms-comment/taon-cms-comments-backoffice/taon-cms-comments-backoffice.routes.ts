//#region imports
import { Routes } from '@angular/router';
import { adminLazyRoute } from '@taon-dev/ui/src';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

export const TaonCmsCommentsBackofficeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./taon-cms-comments-backoffice.component').then(
        m => m.TaonCmsCommentsBackofficeComponent,
      ),

    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'all-preview',
      },
      adminLazyRoute({
        path: 'all-preview',
        menuItem: t.signal.gettext('All comments'),
        icon: 'preview',
        expandable: false,
        loader: () =>
          import('./taon-cms-comments-all-preview-backoffice/taon-cms-comments-all-preview-backoffice.routes').then(
            c => c.TaonCmsCommentsAllPreviewBackofficeRoutes,
          ),
      }),
      adminLazyRoute({
        path: 'blocked',
        menuItem: t.signal.gettext('Blocked Users'),
        icon: 'voice_over_off',
        expandable: false,
        loader: () =>
          import('./taon-cms-comments-blocked-users/taon-cms-comments-blocked-users.routes').then(
            c => c.TaonCmsCommentsBlockedUsersRoutes,
          ),
      }),

      adminLazyRoute({
        path: 'filters',
        menuItem: t.signal.gettext('Filters'),
        icon: 'text_ad_off',
        expandable: false,
        loader: () =>
          import('./taon-cms-comments-filters-settings/taon-cms-comments-filters-settings.routes').then(
            c => c.TaonCmsCommentsFiltersSettingsRoutes,
          ),
      }),
    ],
  },
];

/**
 * By default exporting TaonCmsCommentsBackofficeRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
// export default TaonCmsCommentsBackofficeRoutes;
