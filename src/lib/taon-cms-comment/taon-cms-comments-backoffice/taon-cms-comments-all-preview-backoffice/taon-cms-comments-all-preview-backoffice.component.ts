//#region imports
import { AsyncPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MtxGridColumn } from '@ng-matero/extensions/grid';
import { TaonDatatableComponent } from '@taon-dev/ui/src';
import { TaonCmsCommentApiService } from '../../taon-cms-comment-api.service';
import type { CommentListItem } from '../../taon-cms-comment.controller';
import { Translation } from '@taon-dev/i18n/src';
import { Taon } from 'taon/src';
//#endregion

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'app-taon-cms-comments-all-preview-backoffice',
  templateUrl: './taon-cms-comments-all-preview-backoffice.component.html',
  styleUrls: ['./taon-cms-comments-all-preview-backoffice.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DatePipe, FormsModule, MatButtonModule, RouterLink, TaonDatatableComponent],
  providers: [TaonCmsCommentApiService],
})
export class TaonCmsCommentsAllPreviewBackofficeComponent implements OnInit {
  t = t.for(this);

  private readonly api = inject(TaonCmsCommentApiService);

  readonly comments = signal<CommentListItem[]>([]);

  readonly pageNumber = signal(1);

  readonly pageSize = 10;

  readonly total = signal(0);

  readonly loading = signal(false);

  readonly error = signal('');

  readonly idFilter = signal('');

  readonly textFilter = signal('');

  readonly authorFilter = signal('');

  readonly columns: MtxGridColumn[] = [
    { header: this.t.gettext('ID'), field: 'id', sortable: true, showExpand: true },
    { header: this.t.gettext('Author'), field: 'authorName' },
    {
      header: this.t.gettext('Comment'),
      field: 'body',
      formatter: (comment: CommentListItem) =>
        comment.body.length > 120 ? `${comment.body.slice(0, 120)}...` : comment.body,
    },
    { header: this.t.gettext('Post'), field: 'postTitle' },
    { header: this.t.gettext('Created date'), field: 'createdAt' },
    { header: this.t.gettext('Vote score'), field: 'voteScore' },
    { header: this.t.gettext('Spam reports'), field: 'spamReports' },
  ];

  ngOnInit(): void {
    void this.reload();
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      const result = await this.api.getCommentsBackoffice({
        pageNumber: this.pageNumber(),
        pageSize: this.pageSize,
        id: this.idFilter(),
        text: this.textFilter(),
        author: this.authorFilter(),
      });
      this.comments.set(result.items);
      this.total.set(result.total);
    } catch (error) {
      console.error('[cms-comments-backoffice] Unable to load comments', error);
      this.error.set(error instanceof Error ? error.message : this.t.gettext('Comments could not be loaded.'));
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters(): void {
    this.pageNumber.set(1);
    void this.reload();
  }

  previousPage(): void {
    if (this.pageNumber() > 1) {
      this.pageNumber.update(page => page - 1);
      void this.reload();
    }
  }

  nextPage(): void {
    if (this.pageNumber() * this.pageSize < this.total()) {
      this.pageNumber.update(page => page + 1);
      void this.reload();
    }
  }

  async delete(comment: CommentListItem): Promise<void> {
    try {
      await this.api.deleteComment(comment.id);
      await this.reload();
    } catch (error) {
      console.error('[cms-comments-backoffice] Unable to delete comment', error);
      this.error.set(error instanceof Error ? error.message : this.t.gettext('The comment could not be deleted.'));
    }
  }
}