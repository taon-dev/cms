import { AsyncPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Translation } from '@taon-dev/i18n/src';
import { TaonSessionApiService } from '@taon-dev/session/src';
import type { TaonAuthContextEntity } from '@taon-dev/session/src';
import { Taon } from 'taon/src';

import { TaonCmsCommentApiService } from './taon-cms-comment-api.service';
import type { CommentListItem } from './taon-cms-comment.controller';

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'taon-cms-comments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AsyncPipe, DatePipe, MatButtonModule],
  providers: [TaonCmsCommentApiService, TaonSessionApiService],
  templateUrl: './taon-cms-comments.component.html',
  styleUrl: './taon-cms-comments.component.scss',
})
export class TaonCmsCommentsComponent {
  readonly t = t.for(this);

  readonly contentId = input<number | null>(null);

  private readonly api = inject(TaonCmsCommentApiService);

  private readonly sessionApi = inject(TaonSessionApiService);

  readonly context$ = this.sessionApi.context();

  readonly comments = signal<CommentListItem[]>([]);

  readonly body = signal('');

  readonly loading = signal(false);

  readonly saving = signal(false);

  readonly error = signal('');

  constructor() {
    effect(() => {
      const contentId = this.contentId();
      if (contentId) {
        void this.load(contentId);
      }
    });
  }

  setBody(event: Event): void {
    this.body.set((event.target as HTMLTextAreaElement).value.slice(0, 500));
  }

  async submit(event: Event): Promise<void> {
    event.preventDefault();
    const contentId = this.contentId();
    if (!contentId || !this.body().trim() || this.saving()) {
      return;
    }
    this.saving.set(true);
    this.error.set('');
    try {
      const created = await this.api.createComment(contentId, this.body());
      this.comments.update(comments => [...comments, created]);
      this.body.set('');
    } catch (error) {
      console.error('[taon-cms-comments] Unable to create comment', error);
      this.error.set(
        error instanceof Error
          ? error.message
          : this.t.gettext('Unable to add the comment.'),
      );
    } finally {
      this.saving.set(false);
    }
  }

  async vote(comment: CommentListItem, value: -1 | 1): Promise<void> {
    this.error.set('');
    try {
      this.replace(await this.api.vote(comment.id, value));
    } catch (error) {
      console.error('[taon-cms-comments] Unable to vote on comment', error);
      this.error.set(
        error instanceof Error
          ? error.message
          : this.t.gettext('Unable to vote on the comment.'),
      );
    }
  }

  async report(comment: CommentListItem): Promise<void> {
    this.error.set('');
    try {
      await this.api.reportSpam(comment.id);
      this.replace({
        ...comment,
        currentUserReported: true,
        spamReports: comment.spamReports + 1,
      } as any);
    } catch (error) {
      console.error('[taon-cms-comments] Unable to report comment', error);
      this.error.set(
        error instanceof Error
          ? error.message
          : this.t.gettext('Unable to report the comment.'),
      );
    }
  }

  async remove(comment: CommentListItem): Promise<void> {
    this.error.set('');
    try {
      await this.api.deleteComment(comment.id);
      this.comments.update(comments =>
        comments.filter(item => item.id !== comment.id),
      );
    } catch (error) {
      console.error('[taon-cms-comments] Unable to delete comment', error);
      this.error.set(
        error instanceof Error
          ? error.message
          : this.t.gettext('Unable to delete the comment.'),
      );
    }
  }

  canDelete(
    comment: CommentListItem,
    context: TaonAuthContextEntity | null | undefined,
  ): boolean {
    return (
      Number(context?.user?.id) === comment.userId ||
      !!context?.hasAccess?.toManageCms
    );
  }

  private async load(contentId: number): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    try {
      this.comments.set(await this.api.getComments(contentId));
    } catch (error) {
      console.error('[taon-cms-comments] Unable to load comments', error);
      this.error.set(
        error instanceof Error
          ? error.message
          : this.t.gettext('Unable to load comments.'),
      );
    } finally {
      this.loading.set(false);
    }
  }

  private replace(comment: CommentListItem): void {
    this.comments.update(items =>
      items.map(item => (item.id === comment.id ? comment : item)),
    );
  }
}
