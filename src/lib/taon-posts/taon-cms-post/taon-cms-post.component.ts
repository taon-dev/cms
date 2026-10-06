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
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { TaonConfirmDialogComponent } from '@taon-dev/ui/src';
import { Observable, Subscription, finalize } from 'rxjs';

import { TaonCmsContentApiService } from '../../taon-cms-content/taon-cms-content-api.service';
import type { TaonCmsContentEntity } from '../../taon-cms-content/taon-cms-content.entity';
import type { TaonCmsUpdateContent } from '../../taon-cms-content/taon-cms-content.models';
import { TaonCmsContentType } from '../../taon-cms-content/taon-cms-content.models';
import { TaonCmsRevisionChooserComponent } from '../taon-cms-revision-chooser/taon-cms-revision-chooser.component';
import { TaonRelatedPostChooserComponent } from '../taon-related-post-chooser/taon-related-post-chooser.component';
import type { TaonRelatedPostChooserData } from '../taon-related-post-chooser/taon-related-post-chooser.component';

import { TaonCmsEditableDirective } from './taon-cms-editable.directive';
import type { TaonCmsPostDraft, TaonCmsPostMode } from './taon-cms-post.models';
//#endregion

@Component({
  selector: 'taon-cms-post',
  templateUrl: './taon-cms-post.component.html',
  styleUrls: ['./taon-cms-post.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatRadioModule, TaonCmsEditableDirective],
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
    type: TaonCmsContentType.Normal,
    title: '',
    slug: '',
    excerpt: '',
    body: '',
    videoKey: null,
    audioKey: null,
    attachmentKey: null,
  });

  readonly postTypes = [
    { value: TaonCmsContentType.Normal, label: 'Normal post' },
    { value: TaonCmsContentType.Video, label: 'Video post' },
    { value: TaonCmsContentType.Audio, label: 'Audio post' },
    { value: TaonCmsContentType.Attachment, label: 'Attachment post' },
  ];

  private readonly mediaAttachments = [
    {
      type: TaonCmsContentType.Video,
      key: 'videoKey',
      heading: 'Video Attachment',
      uploadLabel: 'Upload video',
      accept: 'video/*',
    },
    {
      type: TaonCmsContentType.Audio,
      key: 'audioKey',
      heading: 'Audio Attachment',
      uploadLabel: 'Upload audio',
      accept: 'audio/*',
    },
    {
      type: TaonCmsContentType.Attachment,
      key: 'attachmentKey',
      heading: 'File Attachment',
      uploadLabel: 'Upload file',
      accept: '',
    },
  ] as const;

  readonly mediaAttachment = computed(() =>
    this.mediaAttachments.find(media => media.type === this.draft().type),
  );

  readonly busy = signal(false);

  readonly uploading = signal(false);

  readonly dialogOpen = signal(false);

  readonly error = signal('');

  readonly relatedPosts = signal<TaonCmsContentEntity[]>([]);

  readonly relatedPostsLoading = signal(false);

  readonly relatedPostsError = signal('');

  readonly editing = computed(
    () => this.mode() === 'edit' || this.mode() === 'add',
  );

  readonly canSave = computed(
    () => !!this.draft().title.trim() && !!this.draft().slug.trim() &&
      !this.relatedPostsLoading() && !this.relatedPostsError(),
  );

  readonly canPublish = computed(() => {
    const post = this.currentPost();
    return !!post && post.status !== 'published';
  });

  private readonly api = inject(TaonCmsContentApiService);

  private readonly dialog = inject(MatDialog);

  private readonly destroyRef = inject(DestroyRef);

  private relatedPostsLoad?: Subscription;

  constructor() {
    effect(() => {
      const post = this.post();
      untracked(() => this.setPost(post));
    });
  }

  loadRelatedPosts(): void {
    if (this.busy() || this.relatedPostsLoading()) {
      return;
    }
    const post = this.requirePost();
    if (!post) {
      return;
    }
    this.relatedPostsLoading.set(true);
    this.relatedPostsError.set('');
    this.relatedPostsLoad = this.api.listRelatedPosts(post.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.relatedPostsLoading.set(false)),
      )
      .subscribe({
        next: posts => this.relatedPosts.set(posts),
        error: (error: unknown) => {
          console.error('[taon-cms-post] Unable to load related posts', error);
          this.relatedPostsError.set('Related posts could not be loaded. Please try again.');
        },
      });
  }

  addRelatedPost(): void {
    if (!this.editing() || this.busy() || this.dialogOpen() ||
      this.relatedPostsLoading() || this.relatedPostsError()) {
      return;
    }
    this.dialogOpen.set(true);
    const ref = this.dialog.open<
      TaonRelatedPostChooserComponent,
      TaonRelatedPostChooserData,
      TaonCmsContentEntity
    >(TaonRelatedPostChooserComponent, {
      data: {
        postId: this.currentPost()?.id,
        excludedIds: this.relatedPosts().map(post => post.id),
      },
      width: '560px',
      maxWidth: '95vw',
      disableClose: true,
    });
    ref.afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(post => {
        this.dialogOpen.set(false);
        if (post && post.id !== this.currentPost()?.id &&
          !this.relatedPosts().some(related => related.id === post.id)) {
          this.relatedPosts.update(posts => [...posts, post]);
        }
      });
  }

  removeRelatedPost(id: number): void {
    if (!this.editing() || this.busy() || this.dialogOpen() ||
      this.relatedPostsLoading() || this.relatedPostsError()) {
      return;
    }
    this.relatedPosts.update(posts => posts.filter(post => post.id !== id));
  }

  updateDraft<K extends keyof TaonCmsPostDraft>(
    field: K,
    value: TaonCmsPostDraft[K],
  ): void {
    this.draft.update(draft => ({ ...draft, [field]: value }));
  }

  async fileSelected(event: Event): Promise<void> {
    if (!(event.target instanceof HTMLInputElement)) {
      this.error.set('Unable to read the selected media file.');
      return;
    }
    const input = event.target;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    const media = this.mediaAttachment();
    if (!media || !this.editing() || this.busy() || this.dialogOpen()) {
      input.value = '';
      return;
    }
    const draft = this.draft();
    this.busy.set(true);
    this.uploading.set(true);
    this.error.set('');
    try {
      const object = await this.api.uploadMedia(file);
      if (!this.destroyRef.destroyed && this.draft() === draft) {
        this.updateDraft(media.key, object.key);
      }
    } catch (error: unknown) {
      console.error('[taon-cms-post] Unable to upload media', error);
      this.error.set('The media could not be uploaded. Please try again.');
    } finally {
      this.busy.set(false);
      this.uploading.set(false);
      input.value = '';
    }
  }

  removeMedia(): void {
    const media = this.mediaAttachment();
    if (!media || !this.editing() || this.busy() || this.dialogOpen()) {
      return;
    }
    this.updateDraft(media.key, null);
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
          ...this.draft(),
          relatedPostIds: this.relatedPosts().map(post => post.id),
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
    return {
      ...this.draft(),
      relatedPostIds: this.relatedPosts().map(related => related.id),
      expectedVersion: post.version,
    };
  }

  private requirePost(): TaonCmsContentEntity | null {
    const post = this.currentPost();
    if (!post) {
      this.error.set('No post is loaded.');
    }
    return post;
  }

  private setPost(post: TaonCmsContentEntity | null): void {
    this.relatedPostsLoad?.unsubscribe();
    this.relatedPostsLoading.set(false);
    this.relatedPostsError.set('');
    this.currentPost.set(post);
    this.relatedPosts.set(post?.relatedPosts ?? []);
    this.draft.set({
      type: post?.type ?? TaonCmsContentType.Normal,
      title: post?.title ?? '',
      slug: post?.slug ?? '',
      excerpt: post?.excerpt ?? '',
      body: post?.body ?? '',
      videoKey: post?.videoKey ?? null,
      audioKey: post?.audioKey ?? null,
      attachmentKey: post?.attachmentKey ?? null,
    });
    if (post && post.relatedPosts === undefined && this.mode() !== 'view-clean') {
      this.loadRelatedPosts();
    }
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
