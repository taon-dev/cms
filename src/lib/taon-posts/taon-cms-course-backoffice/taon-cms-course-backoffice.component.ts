import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
import { TaonDatatableComponent } from '@taon-dev/ui/src';
import { Translation } from '@taon-dev/i18n/src';
import { finalize } from 'rxjs';
import { Taon } from 'taon/src';

import { TaonCmsContentApiService } from '../../taon-cms-content/taon-cms-content-api.service';
import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';
import { TaonCmsPostTableActions } from '../taon-cms-posts-backoffice/taon-cms-post-table-actions.directive';

import { TaonCmsCourseContentsComponent } from './taon-cms-course-contents.component';
import { TaonCmsCourseCoverComponent } from './taon-cms-course-cover.component';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'taon-cms-course-backoffice',
  templateUrl: './taon-cms-course-backoffice.component.html',
  styleUrls: ['./taon-cms-course-backoffice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatIconModule,
    TaonDatatableComponent,
    TaonCmsCourseContentsComponent,
    TaonCmsCourseCoverComponent,
  ],
  providers: [TaonCmsContentApiService],
})
export class TaonCmsCourseBackofficeComponent
  extends TaonCmsPostTableActions
  implements OnInit {
  readonly t = t.for(this);

  @ViewChild('coverTemplate', { static: true })
  readonly coverTemplate!: TemplateRef<unknown>;

  @ViewChild('visibilityTemplate', { static: true })
  readonly visibilityTemplate!: TemplateRef<unknown>;

  protected override readonly postPath = ['../posts'];

  readonly courses = signal<TaonCmsContentEntity[]>([]);

  readonly loading = signal(false);

  columns: MtxGridColumn[] = [];

  ngOnInit(): void {
    this.columns = [
      { header: 'ID', field: 'id', sortable: true, showExpand: true },
      {
        header: this.t.gettext('Cover'),
        field: 'thumbnailKey',
        cellTemplate: this.coverTemplate,
        width: '110px',
      },
      { header: this.t.gettext('Title'), field: 'title', sortable: true },
      {
        header: this.t.gettext('Visibility'),
        field: 'status',
        sortable: true,
        cellTemplate: this.visibilityTemplate,
      },
      this.actionsColumn,
    ].map(column => ({
      ...column,
      class: (post: TaonCmsContentEntity) =>
        post?.status === 'published' ? 'cms-course-public' : 'cms-course-private',
    }));
    this.reload();
  }

  reload(): void {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.taonCmsContentApiService.listCourses()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: courses => this.courses.set(courses),
        error: (error: unknown) => {
          console.error(
            '[taon-cms-course-backoffice] Unable to load courses',
            error,
          );
          this.error.set(
            this.t.gettext('Courses could not be loaded. Please try reloading.'),
          );
        },
      });
  }
}
