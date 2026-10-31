import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  Input,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
import { Translation } from '@taon-dev/i18n/src';
import { TaonDatatableComponent } from '@taon-dev/ui/src';
import { finalize } from 'rxjs';
import { Taon } from 'taon/src';

import { TaonCmsContentApiService } from '../../taon-cms-content/taon-cms-content-api.service';
import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'taon-cms-course-contents',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, TaonDatatableComponent],
  templateUrl: './taon-cms-course-contents.component.html',
})
export class TaonCmsCourseContentsComponent implements OnInit {
  readonly t = t.for(this);

  @Input({ required: true })
  course!: TaonCmsContentEntity;

  @Input({ required: true })
  actionsColumn!: MtxGridColumn;

  private readonly api = inject(TaonCmsContentApiService);

  private readonly destroyRef = inject(DestroyRef);

  readonly posts = signal<TaonCmsContentEntity[]>([]);

  readonly loading = signal(false);

  readonly error = signal('');

  columns: MtxGridColumn[] = [];

  ngOnInit(): void {
    this.columns = [
      { header: 'ID', field: 'id', sortable: true },
      { header: this.t.gettext('Title'), field: 'title', sortable: true },
      { header: this.t.gettext('Status'), field: 'status', sortable: true },
      this.actionsColumn,
    ];
    this.reload();
  }

  reload(): void {
    if (this.loading()) {
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.api.listRelatedPosts(this.course.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: posts =>
          this.posts.set(posts.filter(post => post.status !== 'archived')),
        error: (error: unknown) => {
          console.error(
            '[taon-cms-course-contents] Unable to load related posts',
            error,
          );
          this.error.set(
            this.t.gettext('Course contents could not be loaded. Please retry.'),
          );
        },
      });
  }
}
