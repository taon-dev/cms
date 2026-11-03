import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  TemplateRef,
  inject,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, map } from 'rxjs';
import { Translation } from '@taon-dev/i18n/src';
import { TaonAdminContentFooterService } from '@taon-dev/ui/src';
import { Taon } from 'taon/src';

import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';
import { TaonCmsPostComponent } from '../taon-cms-post/taon-cms-post.component';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'taon-cms-post-details-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, MatButtonModule, TaonCmsPostComponent],
  template: `
    @if (page$ | async; as page) {
      <a
        mat-button
        (click)="goBack(page.fromCourses)"
        >{{
          page.fromCourses
            ? t.gettext('Back to Courses')
            : t.gettext('Back to Posts')
        }}</a
      >
      <taon-cms-post
        [post]="page.post"
        [mode]="page.create ? 'add' : 'view'"
        (changed)="onChanged($event, page.create)"
        (duplicated)="openPost($event)"
        (editPostRequested)="openPost($event)"
        (cancelled)="onCancelled(page.create)"
        (actionButtonsTemplate)="setFooterTemplate($event)" />
    }
  `,
})
export class TaonCmsPostDetailsPageComponent {
  readonly t = t.for(this);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly contentFooterService = inject(
    TaonAdminContentFooterService,
  );

  private readonly destroyRef = inject(DestroyRef);

  readonly page$ = combineLatest([
    this.route.data,
    this.route.queryParamMap,
  ]).pipe(
    map(([data, queryParams]) => ({
      create: data['createPost'] === true,
      post: (data['post'] as TaonCmsContentEntity | undefined) ?? null,
      fromCourses: queryParams.get('postOrigin') === 'courses',
    })),
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.contentFooterService.setTemplate());
  }

  setFooterTemplate(template: TemplateRef<unknown>): void {
    this.contentFooterService.setTemplate(template);
  }

  goBack(fromCourses: boolean): void {
    void this.router
      .navigate([fromCourses ? '../../courses' : '../'], {
        relativeTo: this.route,
        queryParams: { postOrigin: null },
        queryParamsHandling: 'merge',
      })
      .catch(error => {
        console.error('[taon-cms-post-details-page] Unable to navigate back', error);
      });
  }

  onChanged(post: TaonCmsContentEntity, create: boolean): void {
    if (create) {
      this.openPost(post);
    }
  }

  openPost(post: TaonCmsContentEntity): void {
    void this.router
      .navigate(['../', post.id], {
        relativeTo: this.route,
        queryParamsHandling: 'preserve',
      })
      .catch(error => {
        console.error('[taon-cms-post-details-page] Unable to open post', error);
      });
  }

  onCancelled(create: boolean): void {
    if (create) {
      void this.router
        .navigate(['../'], {
          relativeTo: this.route,
          queryParamsHandling: 'preserve',
        })
        .catch(error => {
          console.error(
            '[taon-cms-post-details-page] Unable to cancel post creation',
            error,
          );
        });
    }
  }
}
