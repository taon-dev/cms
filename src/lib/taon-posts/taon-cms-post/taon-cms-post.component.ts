//#region imports
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { TaonConfirmDialogComponent } from '@taon-dev/ui/src';
import { Observable, finalize } from 'rxjs';

import { TaonCmsContentApiService } from '../../taon-cms-content/taon-cms-content-api.service';
import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';
import type { TaonCmsUpdateContent } from '../../taon-cms-content/taon-cms-content.models';
import { TaonCmsRevisionChooserComponent } from '../taon-cms-revision-chooser/taon-cms-revision-chooser.component';

import { TaonCmsEditableDirective } from './taon-cms-editable.directive';
import type { TaonCmsPostDraft, TaonCmsPostMode } from './taon-cms-post.models';
//#endregion

@Component({
  selector: 'taon-cms-post',
  templateUrl: './taon-cms-post.component.html',
  styleUrls: ['./taon-cms-post.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, TaonCmsEditableDirective],
  providers: [TaonCmsContentApiService],
})
export class TaonCmsPostComponent {
  readonly post = input<TaonCmsContentEntity | null>(null);

  readonly mode = model<TaonCmsPostMode>('view');

  readonly changed = output<TaonCmsContentEntity>();

  readonly deleted = output<TaonCmsContentEntity>();

  readonly cancelled = output<void>();

  readonly currentPost = signal<TaonCmsContentEntity | null>(null);

  readonly draft = signal<TaonCmsPostDraft>({
    title: '',
    slug: '',
    excerpt: '',
    body: '',
  });

  readonly busy = signal(false);

  readonly dialogOpen = signal(false);

  readonly error = signal('');

  readonly editing = computed(
    () => this.mode() === 'edit' || this.mode() === 'add',
  );

  readonly canSave = computed(
    () => !!this.draft().title.trim() && !!this.draft().slug.trim(),
  );

  readonly canPublish = computed(() => {
    const post = this.currentPost();
    return !!post && post.status !== 'published';
  });

  private readonly api = inject(TaonCmsContentApiService);

  private readonly dialog = inject(MatDialog);

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    effect(() => {
      this.setPost(this.post());
    });
  }

  updateDraft(field: keyof TaonCmsPostDraft, value: string): void {
    this.draft.update(draft => ({ ...draft, [field]: value }));
  }

  updateSlug(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.updateDraft('slug', event.target.value);
    }
  }

  edit(): void {
    if (this.mode() !== 'view' || this.busy() || this.dialogOpen()) {
      return;
    }
    if (!this.requirePost()) {
      return;
    }
    this.error.set('');
    this.mode.set('edit');
  }

  cancel(): void {
    if (this.busy() || this.dialogOpen()) {
      return;
    }
    this.setPost(this.currentPost());
    this.error.set('');
    if (this.editing()) {
      this.mode.set('view');
    }
    this.cancelled.emit();
  }

  save(): void {
    if (this.busy() || this.dialogOpen() || !this.editing()) {
      return;
    }
    if (!this.canSave()) {
      this.error.set('A title and slug are required.');
      return;
    }
    if (this.mode() === 'add') {
      this.persist(
        this.api.createContent({
          type: 'article',
          ...this.draft(),
        }),
      );
    } else {
      const post = this.requirePost();
      if (post) {
        this.persist(this.api.updateContent(post.id, this.updateInput(post)));
      }
    }
  }

  publish(): void {
    if (
      this.busy() ||
      this.dialogOpen() ||
      !this.canPublish() ||
      this.mode() === 'view-clean' ||
      this.mode() === 'add'
    ) {
      return;
    }
    if (this.editing() && !this.canSave()) {
      this.error.set('A title and slug are required.');
      return;
    }
    const post = this.requirePost();
    if (post) {
      this.persist(
        this.api.updateContent(post.id, {
          ...(this.editing()
            ? this.updateInput(post)
            : { expectedVersion: post.version }),
          status: 'published',
          publishedAt: new Date(),
        }),
      );
    }
  }

  revert(): void {
    const post = this.requirePost();
    if (!post || this.busy() || this.dialogOpen() || this.mode() === 'view-clean') {
      return;
    }
    this.dialogOpen.set(true);
    const ref = this.dialog.open<
      TaonCmsRevisionChooserComponent,
      TaonCmsContentEntity,
      TaonCmsContentEntity
    >(TaonCmsRevisionChooserComponent, {
      data: post,
      width: '560px',
      maxWidth: '95vw',
      disableClose: true,
    });
    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(restored => {
        this.dialogOpen.set(false);
        if (restored) {
          this.acceptPost(restored);
        }
      });
  }

  delete(): void {
    const post = this.requirePost();
    if (!post || this.busy() || this.dialogOpen() || this.mode() === 'view-clean') {
      return;
    }
    this.dialogOpen.set(true);
    const ref = this.dialog.open(TaonConfirmDialogComponent, {
      data: {
        title: 'Delete post?',
        message: 'This archives the post. It can be restored from its revisions.',
        confirmText: 'Delete',
      },
    });
    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(confirmed => {
        this.dialogOpen.set(false);
        if (confirmed) {
          this.persist(this.api.deleteContent(post.id, post.version), true);
        }
      });
  }

  private updateInput(post: TaonCmsContentEntity): TaonCmsUpdateContent {
    return { ...this.draft(), expectedVersion: post.version };
  }

  private requirePost(): TaonCmsContentEntity | null {
    const post = this.currentPost();
    if (!post) {
      this.error.set('No post is loaded.');
    }
    return post;
  }

  private setPost(post: TaonCmsContentEntity | null): void {
    this.currentPost.set(post);
    this.draft.set({
      title: post?.title ?? '',
      slug: post?.slug ?? '',
      excerpt: post?.excerpt ?? '',
      body: post?.body ?? '',
    });
  }

  private acceptPost(post: TaonCmsContentEntity): void {
    this.setPost(post);
    this.error.set('');
    this.mode.set('view');
    this.changed.emit(post);
  }

  private persist(
    request: Observable<TaonCmsContentEntity>,
    deleting = false,
  ): void {
    if (this.busy() || this.dialogOpen() || this.mode() === 'view-clean') {
      return;
    }
    this.busy.set(true);
    this.error.set('');
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: post => {
          this.acceptPost(post);
          if (deleting) {
            this.deleted.emit(post);
          }
        },
        error: (error: unknown) => {
          console.error('[taon-cms-post] Unable to save post', error);
          this.error.set(
            'The post could not be saved. Check the slug and your connection. ' +
              'If another user changed it, close and reopen the post before retrying.',
          );
        },
      });
  }
}
