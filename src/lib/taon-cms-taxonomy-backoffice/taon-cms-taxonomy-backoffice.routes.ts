import { Routes } from '@angular/router';

export const TaonCmsCategoriesBackofficeRoutes: Routes = [
  {
    path: '',
    data: { taxonomy: 'category' },
    loadComponent: () =>
      import('./taon-cms-taxonomy-backoffice.component').then(
        m => m.TaonCmsTaxonomyBackofficeComponent,
      ),
  },
];

export const TaonCmsTagsBackofficeRoutes: Routes = [
  {
    path: '',
    data: { taxonomy: 'tag' },
    loadComponent: () =>
      import('./taon-cms-taxonomy-backoffice.component').then(
        m => m.TaonCmsTaxonomyBackofficeComponent,
      ),
  },
];
