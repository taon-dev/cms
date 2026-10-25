import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';

import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';
import { TaonCmsPostComponent } from '../taon-cms-post/taon-cms-post.component';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'taon-cms-post-details-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, MatButtonModule, RouterLink, TaonCmsPostComponent],
  template: `
    @if (page$ | async; as page) {
      <a
        mat-button
        routerLink="../"
        >{{ t.gettext('Back to Posts') }}</a
      >
      <taon-cms-post
        [post]="page.post"
        [mode]="page.create ? 'add' : 'view'"
        (changed)="onChanged($event, page.create)"
        (duplicated)="openPost($event)"
        (cancelled)="onCancelled(page.create)" />
    }
  `,
})
export class TaonCmsPostDetailsPageComponent {
  readonly t = t.for(this);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  readonly page$ = this.route.data.pipe(
    map(data => ({
      create: data['createPost'] === true,
      post: (data['post'] as TaonCmsContentEntity | undefined) ?? null,
    })),
  );

  onChanged(post: TaonCmsContentEntity, create: boolean): void {
    if (create) {
      this.openPost(post);
    }
  }

  openPost(post: TaonCmsContentEntity): void {
    void this.router.navigate(['../', post.id], { relativeTo: this.route });
  }

  onCancelled(create: boolean): void {
    if (create) {
      void this.router.navigate(['../'], { relativeTo: this.route });
    }
  }
}
