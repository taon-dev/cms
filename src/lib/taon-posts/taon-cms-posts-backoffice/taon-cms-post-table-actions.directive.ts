import { DestroyRef, Directive, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
import { Translation } from '@taon-dev/i18n/src';
import { TaonConfirmDialogComponent } from '@taon-dev/ui/src';
import { finalize } from 'rxjs';
import { Taon } from 'taon/src';

import { TaonCmsContentApiService } from '../../taon-cms-content/taon-cms-content-api.service';
import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Directive()
export abstract class TaonCmsPostTableActions {
  private readonly actionsTranslation = t.for(this);

  readonly taonCmsContentApiService = inject(TaonCmsContentApiService);

  readonly deleting = signal<number | null>(null);

  readonly duplicating = signal(false);

  readonly error = signal('');

  protected readonly destroyRef = inject(DestroyRef);

  protected readonly postPath: string[] = [];

  private readonly dialog = inject(MatDialog);

  private readonly route = inject(ActivatedRoute);

  private readonly router = inject(Router);

  readonly actionsColumn: MtxGridColumn = {
    header: this.actionsTranslation.gettext('Actions'),
    field: 'actions',
    type: 'button',
    buttons: [
      {
        type: 'icon',
        icon: 'content_copy',
        tooltip: this.actionsTranslation.gettext('Duplicate post'),
        disabled: () => this.duplicating(),
        click: (post: TaonCmsContentEntity) => this.duplicate(post),
      },
      {
        type: 'icon',
        icon: 'open_in_new',
        tooltip: this.actionsTranslation.gettext('Post details'),
        click: (post: TaonCmsContentEntity) => this.openDetails(post),
      },
      {
        type: 'icon',
        icon: 'delete',
        tooltip: this.actionsTranslation.gettext('Delete (archive) post'),
        disabled: (post: TaonCmsContentEntity) =>
          post.status === 'archived' || this.deleting() !== null,
        click: (post: TaonCmsContentEntity) => this.delete(post),
      },
    ],
  };

  abstract reload(): void;

  add(): void {
    this.openPost('new');
  }

  openDetails(post: TaonCmsContentEntity): void {
    this.openPost(post.id);
  }

  private openPost(id: number | 'new'): void {
    const postsRoute = this.route.parent;
    if (!postsRoute) {
      this.error.set(
        this.actionsTranslation.gettext('The Post details route is unavailable.'),
      );
      return;
    }
    void this.router.navigate([...this.postPath, id], { relativeTo: postsRoute });
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
            this.actionsTranslation.gettext(
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
        title: this.actionsTranslation.gettext('Delete post?'),
        message: this.actionsTranslation.gettext(
          'This archives the post. It can be restored from its revisions.',
        ),
        confirmText: this.actionsTranslation.gettext('Delete'),
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
                this.actionsTranslation.gettext(
                  'The post could not be deleted. Refresh the table before retrying.',
                ),
              );
            },
          });
      });
  }
}
