import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
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
    @if (post$ | async; as post) {
      <a
        mat-button
        routerLink="../"
        >{{ t.gettext('Back to Posts') }}</a
      >
      <taon-cms-post [post]="post"></taon-cms-post>
    }
  `,
})
export class TaonCmsPostDetailsPageComponent {
  readonly t = t.for(this);

  readonly post$ = inject(ActivatedRoute).data.pipe(
    map(data => data['post'] as TaonCmsContentEntity),
  );
}
