import { Routes } from '@angular/router';

export const TaonCmsCourseBackofficeRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./taon-cms-course-backoffice.component').then(
        m => m.TaonCmsCourseBackofficeComponent,
      ),
  },
];
