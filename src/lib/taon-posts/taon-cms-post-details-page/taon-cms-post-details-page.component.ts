import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';

import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';
import { TaonCmsPostComponent } from '../taon-cms-post/taon-cms-post.component';

@Component({
  selector: 'taon-cms-post-details-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, MatButtonModule, RouterLink, TaonCmsPostComponent],
  template: `
    @if (post$ | async; as post) {
      <a mat-button routerLink="../">Back to Posts</a>
      <taon-cms-post [post]="post"></taon-cms-post>
    }
  `,
})
export class TaonCmsPostDetailsPageComponent {
  readonly post$ = inject(ActivatedRoute).data.pipe(
    map(data => data['post'] as TaonCmsContentEntity),
  );
}
