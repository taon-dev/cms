import { Routes } from '@angular/router';

export const TaonCmsAssetsBackofficeRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./taon-cms-assets-backoffice.component').then(
        m => m.TaonCmsAssetsBackofficeComponent,
      ),
  },
];
