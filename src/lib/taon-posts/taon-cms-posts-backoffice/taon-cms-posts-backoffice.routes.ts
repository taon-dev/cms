//#region imports
import { inject } from '@angular/core';
import { Routes } from '@angular/router';
import { ResolveFn } from '@angular/router';

import { TaonCmsContentApiService } from '../../taon-cms-content/taon-cms-content-api.service';
import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';
//#endregion

const resolvePost: ResolveFn<TaonCmsContentEntity> = async route => {
  const id = Number(route.paramMap.get('id'));
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('Invalid Post ID');
  }
  const apiService = inject(TaonCmsContentApiService);
  const post = (await apiService.taonCmsContentController.getBy(id).request())
    .body.json;
  if (!post) {
    throw new Error('Post not found');
  }
  return post;
};

export const TaonCmsPostsBackofficeRoutes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () =>
      import('./taon-cms-posts-backoffice.component').then(
        m => m.TaonCmsPostsBackofficeComponent,
      ),
  },
  {
    path: ':id',
    data: { hideInNavigation: true },
    providers: [TaonCmsContentApiService],
    resolve: { post: resolvePost },
    loadComponent: () =>
      import('../taon-cms-post-details-page/taon-cms-post-details-page.component').then(
        m => m.TaonCmsPostDetailsPageComponent,
      ),
  },
];

/**
 * By default exporting TaonCmsPostsBackofficeRoutes,
 * the command `taon generate:app:routes`
 * will automatically add them to the root routes in ./src/app.ts.
 */
// export default TaonCmsPostsBackofficeRoutes;
