//#region imports
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
import {
  TaonConfirmDialogComponent,
  TaonDatatableComponent,
} from '@taon-dev/ui/src';
import { Translation } from '@taon-dev/i18n/src';
import { finalize } from 'rxjs';
import { Taon } from 'taon/src';

import { TaonCmsContentApiService } from '../../taon-cms-content/taon-cms-content-api.service';
import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'app-taon-cms-posts-backoffice',
  templateUrl: './taon-cms-posts-backoffice.component.html',
  styleUrls: ['./taon-cms-posts-backoffice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, TaonDatatableComponent],
  providers: [TaonCmsContentApiService],
})
export class TaonCmsPostsBackofficeComponent {
  readonly t = t.for(this);

  @ViewChild(TaonDatatableComponent)
  readonly datatable!: TaonDatatableComponent;

  readonly taonCmsContentApiService = inject(TaonCmsContentApiService);

  readonly posts = signal<TaonCmsContentEntity[]>([]);

  readonly loading = signal(false);

  readonly deleting = signal<number | null>(null);

  readonly duplicating = signal(false);

  readonly error = signal('');

  private readonly dialog = inject(MatDialog);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  private readonly destroyRef = inject(DestroyRef);

  public get crud() {
    return this.taonCmsContentApiService.crudController;
  }

  readonly columns: MtxGridColumn[] = [
    { header: 'ID', field: 'id', sortable: true },
    { header: this.t.gettext('Title'), field: 'title', sortable: true },
    { header: this.t.gettext('Status'), field: 'status', sortable: true },
    {
      header: this.t.gettext('Actions'),
      field: 'actions',
      type: 'button',
      buttons: [
        {
          type: 'icon',
          icon: 'content_copy',
          tooltip: this.t.gettext('Duplicate post'),
          disabled: () => this.duplicating(),
          click: (post: TaonCmsContentEntity) => this.duplicate(post),
        },
        {
          type: 'icon',
          icon: 'open_in_new',
          tooltip: this.t.gettext('Post details'),
          click: (post: TaonCmsContentEntity) => this.openDetails(post),
        },
        {
          type: 'icon',
          icon: 'delete',
          tooltip: this.t.gettext('Delete (archive) post'),
          disabled: (post: TaonCmsContentEntity) =>
            post.status === 'archived' || this.deleting() !== null,
          click: (post: TaonCmsContentEntity) => this.delete(post),
        },
      ],
    },
  ];

  reload(): void {
    this.datatable.reload();
  }

  ngAfterViewInit(): void {
    this.reload();
  }

  add(): void {
    this.openPost('new');
  }

  openDetails(post: TaonCmsContentEntity): void {
    this.openPost(post.id);
  }

  private openPost(id: number | 'new'): void {
    const postsRoute = this.route.parent;
    if (!postsRoute) {
      this.error.set(this.t.gettext('The Post details route is unavailable.'));
      return;
    }
    void this.router.navigate([id], { relativeTo: postsRoute });
  }

  duplicate(post: TaonCmsContentEntity): void {
    if (this.duplicating()) {
      return;
    }
    this.duplicating.set(true);
    this.error.set('');
    this.taonCmsContentApiService
      .duplicateContent(post.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.duplicating.set(false)),
      )
      .subscribe({
        next: duplicate => this.openDetails(duplicate),
        error: (error: unknown) => {
          console.error(
            '[taon-cms-posts-backoffice] Unable to duplicate post',
            error,
          );
          this.error.set(
            this.t.gettext(
              'The post could not be duplicated. Please try again.',
            ),
          );
        },
      });
  }

  delete(post: TaonCmsContentEntity): void {
    if (this.deleting() !== null || post.status === 'archived') {
      return;
    }
    this.deleting.set(post.id);
    const ref = this.dialog.open(TaonConfirmDialogComponent, {
      data: {
        title: this.t.gettext('Delete post?'),
        message: this.t.gettext(
          'This archives the post. It can be restored from its revisions.',
        ),
        confirmText: this.t.gettext('Delete'),
      },
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        if (!confirmed) {
          this.deleting.set(null);
          return;
        }
        this.error.set('');
        this.taonCmsContentApiService
          .deleteContent(post.id, post.version)
          .pipe(
            takeUntilDestroyed(this.destroyRef),
            finalize(() => this.deleting.set(null)),
          )
          .subscribe({
            next: () => this.reload(),
            error: (error: unknown) => {
              console.error(
                '[taon-cms-posts-backoffice] Unable to delete post',
                error,
              );
              this.error.set(
                this.t.gettext(
                  'The post could not be deleted. Refresh the table before retrying.',
                ),
              );
            },
          });
      });
  }
}
