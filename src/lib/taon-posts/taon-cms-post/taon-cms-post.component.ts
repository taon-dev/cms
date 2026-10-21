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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { TaonPermissionApiService } from '@taon-dev/session/src';
import type { TaonPermissionEntity } from '@taon-dev/session/src';
import { TaonConfirmDialogComponent } from '@taon-dev/ui/src';
import { Translation } from '@taon-dev/i18n/src';
import { Observable, Subscription, finalize, firstValueFrom, take } from 'rxjs';
import { Taon } from 'taon/src';

import type { TaonCmsApplicationHookEntity } from '../../taon-cms-application-hook/taon-cms-application-hook.entity';
import type { TaonCmsApplicationHook } from '../../taon-cms-application-hooks';
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

const t = Translation.for(Taon.__FILE_RELATIVE_PATH, Taon.LANG_IMPORT_MAP);

@Component({
  selector: 'taon-cms-post',
  templateUrl: './taon-cms-post.component.html',
  styleUrls: ['./taon-cms-post.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressBarModule,
    MatRadioModule,
    MatSelectModule,
    TaonCmsEditableDirective,
  ],
  providers: [TaonCmsContentApiService, TaonPermissionApiService],
})
export class TaonCmsPostComponent {
  readonly t = t.for(this);

  //#region fields and getters
  readonly post = input<TaonCmsContentEntity | null>(null);

  readonly mode = model<TaonCmsPostMode>('view');

  readonly changed = output<TaonCmsContentEntity>();

  readonly deleted = output<TaonCmsContentEntity>();

  readonly cancelled = output<void>();

  readonly currentPost = signal<TaonCmsContentEntity | null>(null);

  readonly placeholderShortIntro = this.t.signal.gettext(
    'A short introduction...',
  );

  readonly placeholderTitle = this.t.signal.gettext('Title');

  readonly placeholderTellYourStory =
    this.t.signal.gettext('Tell your story...');

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
    {
      value: TaonCmsContentType.Normal,
      label: this.t.gettext('Normal post'),
    },
    { value: TaonCmsContentType.Video, label: this.t.gettext('Video post') },
    { value: TaonCmsContentType.Audio, label: this.t.gettext('Audio post') },
    {
      value: TaonCmsContentType.Attachment,
      label: this.t.gettext('Attachment post'),
    },
  ];

  private readonly mediaAttachments = [
    {
      type: TaonCmsContentType.Video,
      key: 'videoKey',
      heading: this.t.gettext('Video Attachment'),
      uploadLabel: this.t.gettext('Upload video'),
      accept: 'video/*',
    },
    {
      type: TaonCmsContentType.Audio,
      key: 'audioKey',
      heading: this.t.gettext('Audio Attachment'),
      uploadLabel: this.t.gettext('Upload audio'),
      accept: 'audio/*',
    },
    {
      type: TaonCmsContentType.Attachment,
      key: 'attachmentKey',
      heading: this.t.gettext('File Attachment'),
      uploadLabel: this.t.gettext('Upload file'),
      accept: '',
    },
  ] as const;

  readonly mediaAttachment = computed(() =>
    this.mediaAttachments.find(media => media.type === this.draft().type),
  );

  readonly busy = signal(false);

  readonly uploading = signal(false);

  readonly uploadProgress = signal(0);

  readonly mediaPreviewUrl = signal('');

  readonly mediaPreviewLoading = signal(false);

  readonly mediaPreviewError = signal('');

  private readonly mediaFileNames = signal<Record<string, string>>({});

  private readonly uploadedMediaPreview = signal<{
    key: string;
    url: string;
    fileName: string;
  } | null>(null);

  private mediaPreviewRequest = 0;

  private mediaPreviewSignature = '';

  readonly dialogOpen = signal(false);

  readonly error = signal('');

  readonly relatedPosts = signal<TaonCmsContentEntity[]>([]);

  readonly relatedPostsLoading = signal(false);

  readonly relatedPostsError = signal('');

  readonly applicationHooks = signal<TaonCmsApplicationHookEntity[]>([]);

  readonly applicationHooksLoading = signal(false);

  readonly applicationHooksError = signal('');

  readonly useAsApplicationHook = signal(false);

  readonly selectedApplicationHook = signal<TaonCmsApplicationHook | null>(
    null,
  );

  readonly permissions = signal<TaonPermissionEntity[]>([]);

  readonly applyPermissionsToRelatedPosts = signal(false);

  readonly permissionSource = signal<{ id: number; title: string } | null>(
    null,
  );

  readonly permissionsLoading = signal(false);

  readonly permissionsError = signal('');

  readonly permissionOptions = signal<TaonPermissionEntity[]>([]);

  readonly permissionOptionsLoading = signal(false);

  readonly permissionOptionsError = signal('');

  readonly selectedPermissionId = signal<number | null>(null);

  readonly availablePermissions = computed(() => {
    const assignedIds = new Set(
      this.permissions().map(permission => permission.id),
    );
    return this.permissionOptions().filter(
      permission => !assignedIds.has(permission.id),
    );
  });

  readonly editing = computed(
    () => this.mode() === 'edit' || this.mode() === 'add',
  );

  readonly canSave = computed(
    () =>
      !!this.draft().title.trim() &&
      !!this.draft().slug.trim() &&
      !this.relatedPostsLoading() &&
      !this.relatedPostsError() &&
      !this.applicationHooksLoading() &&
      !this.applicationHooksError() &&
      (!this.useAsApplicationHook() || !!this.selectedApplicationHook()) &&
      !this.permissionsLoading() &&
      !this.permissionsError(),
  );

  readonly canPublish = computed(() => {
    const post = this.currentPost();
    return !!post && post.status !== 'published';
  });

  private readonly api = inject(TaonCmsContentApiService);

  private readonly permissionApi = inject(TaonPermissionApiService);

  private readonly dialog = inject(MatDialog);

  private readonly destroyRef = inject(DestroyRef);

  private relatedPostsLoad?: Subscription;

  private applicationHooksLoad?: Subscription;

  private permissionsLoad?: Subscription;
  //#endregion

  //#region constructor
  constructor() {
    effect(() => {
      const post = this.post();
      untracked(() => this.setPost(post));
    });
    effect(() => {
      if (this.editing()) {
        untracked(() => {
          this.loadApplicationHooks();
          this.loadPermissionOptions();
        });
      }
    });
    effect(() => {
      const media = this.mediaAttachment();
      const key = media ? this.draft()[media.key] : null;
      const slug = this.draft().slug;
      const editing = this.editing();
      const viewing = !!this.currentPost() && this.mode() !== 'add';
      const stagedPreview = this.uploadedMediaPreview();
      if ((!editing && !viewing) || !media || !key) {
        this.mediaPreviewSignature = '';
        this.mediaPreviewRequest += 1;
        this.mediaPreviewUrl.set('');
        this.mediaPreviewLoading.set(false);
        this.mediaPreviewError.set('');
        return;
      }
      if (stagedPreview?.key === key) {
        const signature = `upload:${key}:${stagedPreview.url}`;
        if (signature === this.mediaPreviewSignature) {
          return;
        }
        this.mediaPreviewSignature = signature;
        this.mediaPreviewRequest += 1;
        this.mediaPreviewUrl.set(stagedPreview.url);
        this.mediaPreviewLoading.set(false);
        this.mediaPreviewError.set('');
        return;
      }
      if (!slug) {
        this.mediaPreviewSignature = '';
        this.mediaPreviewRequest += 1;
        this.mediaPreviewUrl.set('');
        this.mediaPreviewLoading.set(false);
        this.mediaPreviewError.set('');
        return;
      }
      const signature = `${this.mode()}:${media.type}:${slug}:${key}`;
      if (signature === this.mediaPreviewSignature) {
        return;
      }
      this.mediaPreviewSignature = signature;
      const requestId = ++this.mediaPreviewRequest;
      this.mediaPreviewUrl.set('');
      this.mediaPreviewLoading.set(true);
      this.mediaPreviewError.set('');
      const getLink = editing
        ? this.getMediaLink(slug, media.type)
        : this.getMediaLinkForView(slug, media.type);
      void getLink
        .then(url => {
          if (
            requestId === this.mediaPreviewRequest &&
            !this.destroyRef.destroyed
          ) {
            this.mediaPreviewUrl.set(url);
          }
        })
        .catch((error: unknown) => {
          console.error('[taon-cms-post] Unable to load media preview', error);
          if (
            requestId === this.mediaPreviewRequest &&
            !this.destroyRef.destroyed
          ) {
            this.mediaPreviewError.set(
              this.t.gettext(
                'Media preview could not be loaded. Please reopen the editor to try again.',
              ),
            );
          }
        })
        .finally(() => {
          if (
            requestId === this.mediaPreviewRequest &&
            !this.destroyRef.destroyed
          ) {
            this.mediaPreviewLoading.set(false);
          }
        });
    });
  }
  //#endregion

  //#region methods / load related posts
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
    this.relatedPostsLoad = this.api
      .listRelatedPosts(post.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.relatedPostsLoading.set(false)),
      )
      .subscribe({
        next: posts => this.relatedPosts.set(posts),
        error: (error: unknown) => {
          console.error('[taon-cms-post] Unable to load related posts', error);
          this.relatedPostsError.set(
            this.t.gettext(
              'Related posts could not be loaded. Please try again.',
            ),
          );
        },
      });
  }
  //#endregion

  //#region methods / add related post
  addRelatedPost(): void {
    if (
      !this.editing() ||
      this.busy() ||
      this.dialogOpen() ||
      this.relatedPostsLoading() ||
      this.relatedPostsError()
    ) {
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
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(post => {
        this.dialogOpen.set(false);
        if (
          post &&
          post.id !== this.currentPost()?.id &&
          !this.relatedPosts().some(related => related.id === post.id)
        ) {
          this.relatedPosts.update(posts => [...posts, post]);
        }
      });
  }
  //#endregion

  //#region methods / remove related post
  removeRelatedPost(id: number): void {
    if (
      !this.editing() ||
      this.busy() ||
      this.dialogOpen() ||
      this.relatedPostsLoading() ||
      this.relatedPostsError()
    ) {
      return;
    }
    this.relatedPosts.update(posts => posts.filter(post => post.id !== id));
  }
  //#endregion

  //#region methods / application hooks
  loadApplicationHooks(): void {
    if (this.applicationHooksLoading()) {
      return;
    }
    this.applicationHooksLoading.set(true);
    this.applicationHooksError.set('');
    this.applicationHooksLoad = this.api
      .listApplicationHooks()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.applicationHooksLoading.set(false)),
      )
      .subscribe({
        next: hooks => {
          this.applicationHooks.set(hooks);
          this.setApplicationHookSelection(this.currentPost(), hooks);
        },
        error: (error: unknown) => {
          console.error(
            '[taon-cms-post] Unable to load application hooks',
            error,
          );
          this.applicationHooksError.set(
            this.t.gettext(
              'Application hooks could not be loaded. Please try again.',
            ),
          );
        },
      });
  }

  setUseAsApplicationHook(enabled: boolean): void {
    this.useAsApplicationHook.set(enabled);
  }

  applicationHookInUseByAnotherPost(
    applicationHook: TaonCmsApplicationHookEntity,
  ): boolean {
    return (
      applicationHook.contentId !== null &&
      applicationHook.contentId !== this.currentPost()?.id
    );
  }

  applicationHookLabel(hook: TaonCmsApplicationHook): string {
    return hook.split('-').join('_').toUpperCase();
  }
  //#endregion

  //#region methods / load permissions
  loadPermissions(): void {
    if (this.permissionsLoading()) {
      return;
    }
    const post = this.requirePost();
    if (!post) {
      return;
    }
    this.permissionsLoading.set(true);
    this.permissionsError.set('');
    this.permissionsLoad = this.api
      .getPermissionConfiguration(post.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.permissionsLoading.set(false)),
      )
      .subscribe({
        next: configuration => {
          this.permissions.set(configuration.permissions);
          this.permissionSource.set(configuration.source);
        },
        error: (error: unknown) => {
          console.error('[taon-cms-post] Unable to load permissions', error);
          this.permissionsError.set(
            this.t.gettext(
              'Permissions could not be loaded. Please try again.',
            ),
          );
        },
      });
  }
  //#endregion

  //#region methods / add permission
  addPermission(): void {
    if (
      !this.editing() ||
      this.busy() ||
      this.dialogOpen() ||
      this.permissionSource() ||
      this.permissionsLoading() ||
      this.permissionsError()
    ) {
      return;
    }
    const permissionId = this.selectedPermissionId();
    const permission = this.availablePermissions().find(
      item => item.id === permissionId,
    );
    if (permission) {
      this.permissions.update(permissions => [...permissions, permission]);
      this.selectedPermissionId.set(null);
    }
  }
  //#endregion

  //#region methods / remove permission
  removePermission(id: number): void {
    if (
      !this.editing() ||
      this.busy() ||
      this.dialogOpen() ||
      this.permissionSource() ||
      this.permissionsLoading() ||
      this.permissionsError()
    ) {
      return;
    }
    this.permissions.update(items =>
      items.filter(permission => permission.id !== id),
    );
  }
  //#endregion

  //#region methods / load permission options
  loadPermissionOptions(): void {
    if (
      this.permissionOptionsLoading() ||
      this.permissionOptions().length > 0
    ) {
      return;
    }
    this.permissionOptionsLoading.set(true);
    this.permissionOptionsError.set('');
    this.permissionApi.allMyEntities$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.permissionOptionsLoading.set(false)),
      )
      .subscribe({
        next: permissions => this.permissionOptions.set(permissions),
        error: (error: unknown) => {
          console.error(
            '[taon-cms-post] Unable to load permission options',
            error,
          );
          this.permissionOptionsError.set(
            this.t.gettext(
              'Available permissions could not be loaded. Please try again.',
            ),
          );
        },
      });
  }
  //#endregion

  //#region methods / update draft
  updateDraft<K extends keyof TaonCmsPostDraft>(
    field: K,
    value: TaonCmsPostDraft[K],
  ): void {
    this.draft.update(draft => ({ ...draft, [field]: value }));
  }
  //#endregion

  //#region methods / file selected
  async fileSelected(event: Event): Promise<void> {
    if (!(event.target instanceof HTMLInputElement)) {
      this.error.set(this.t.gettext('Unable to read the selected media file.'));
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
    this.uploadProgress.set(0);
    this.error.set('');
    try {
      const object = await this.api.uploadMedia(file, percentage => {
        if (!this.destroyRef.destroyed) {
          this.uploadProgress.set(percentage);
        }
      });
      if (!this.destroyRef.destroyed && this.draft() === draft) {
        const fileName = object.fileName || file.name;
        this.mediaFileNames.update(names => ({
          ...names,
          [object.key]: fileName,
        }));
        if (object.downloadUrl) {
          this.uploadedMediaPreview.set({
            key: object.key,
            url: this.uploadedMediaUrl(object.downloadUrl, media.type),
            fileName,
          });
        }
        this.updateDraft(media.key, object.key);
      }
    } catch (error: unknown) {
      console.error('[taon-cms-post] Unable to upload media', error);
      this.error.set(
        this.t.gettext('The media could not be uploaded. Please try again.'),
      );
    } finally {
      this.busy.set(false);
      this.uploading.set(false);
      this.uploadProgress.set(0);
      input.value = '';
    }
  }
  //#endregion

  //#region methods / remove media
  removeMedia(): void {
    const media = this.mediaAttachment();
    if (!media || !this.editing() || this.busy() || this.dialogOpen()) {
      return;
    }
    this.uploadedMediaPreview.set(null);
    this.updateDraft(media.key, null);
  }
  //#endregion

  //#region methods / uploaded media URL
  private uploadedMediaUrl(url: string, type: TaonCmsContentType): string {
    if (type !== TaonCmsContentType.Attachment) {
      return url;
    }
    const parsedUrl = new URL(url);
    parsedUrl.searchParams.set('download', 'true');
    return parsedUrl.href;
  }
  //#endregion

  //#region methods / get media link
  private getMediaLink(
    slug: string,
    type: TaonCmsContentType,
  ): Promise<string> {
    switch (type) {
      case TaonCmsContentType.Video:
        return firstValueFrom(this.api.getVideoLinkBySlug(slug));
      case TaonCmsContentType.Audio:
        return firstValueFrom(this.api.getAudioLinkBySlug(slug));
      case TaonCmsContentType.Attachment:
        return this.api.getAttachmentLinkBySlug(slug);
      default:
        return Promise.reject(new Error('This post type has no media.'));
    }
  }
  //#endregion

  //#region methods / get media link for viewing
  private async getMediaLinkForView(
    slug: string,
    type: TaonCmsContentType,
  ): Promise<string> {
    try {
      switch (type) {
        case TaonCmsContentType.Video:
          return await this.api.getPublicVideoLinkBySlug(slug);
        case TaonCmsContentType.Audio:
          return await this.api.getPublicAudioLinkBySlug(slug);
        case TaonCmsContentType.Attachment:
          return await this.api.getPublicAttachmentLinkBySlug(slug);
        default:
          throw new Error('This post type has no media.');
      }
    } catch {
      return this.getMediaLink(slug, type);
    }
  }
  //#endregion

  //#region methods / media file name
  mediaFileName(key: string): string {
    const fileName = this.mediaFileNames()[key];
    if (fileName) {
      return fileName;
    }
    const uploaded = this.uploadedMediaPreview();
    if (uploaded?.key === key) {
      return uploaded.fileName;
    }
    const storedName = key.split('/').pop() || key;
    return storedName.replace(/^[0-9a-f-]{36}__/i, '');
  }
  //#endregion

  //#region methods / update slug
  updateSlug(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.updateDraft('slug', event.target.value);
    }
  }
  //#endregion

  //#region methods / edit
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
  //#endregion

  //#region methods / cancel
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
  //#endregion

  //#region methods / save
  save(): void {
    if (this.busy() || this.dialogOpen() || !this.editing()) {
      return;
    }
    if (!this.canSave()) {
      this.error.set(this.t.gettext('A title and slug are required.'));
      return;
    }
    if (this.mode() === 'add') {
      this.persist(
        this.api.createContent({
          ...this.draft(),
          relatedPostIds: this.relatedPosts().map(post => post.id),
          permissionIds: this.permissions().map(permission => permission.id),
          applyPermissionsToRelatedPosts: this.applyPermissionsToRelatedPosts(),
          applicationHook: this.useAsApplicationHook()
            ? this.selectedApplicationHook()
            : null,
        }),
      );
    } else {
      const post = this.requirePost();
      if (post) {
        this.persist(this.api.updateContent(post.id, this.updateInput(post)));
      }
    }
  }
  //#endregion

  //#region methods / publish
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
      this.error.set(this.t.gettext('A title and slug are required.'));
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
  //#endregion

  //#region methods / unpublish
  unpublish(): void {
    const post = this.currentPost();
    if (
      !post ||
      post.status !== 'published' ||
      this.busy() ||
      this.dialogOpen() ||
      this.mode() === 'view-clean' ||
      this.mode() === 'add'
    ) {
      return;
    }
    this.persist(
      this.api.updateContent(post.id, {
        expectedVersion: post.version,
        status: 'draft',
      }),
    );
  }
  //#endregion

  //#region methods / revert
  revert(): void {
    const post = this.requirePost();
    if (
      !post ||
      this.busy() ||
      this.dialogOpen() ||
      this.mode() === 'view-clean'
    ) {
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
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(restored => {
        this.dialogOpen.set(false);
        if (restored) {
          this.acceptPost(restored);
        }
      });
  }
  //#endregion

  //#region methods / delete
  delete(): void {
    const post = this.requirePost();
    if (
      !post ||
      this.busy() ||
      this.dialogOpen() ||
      this.mode() === 'view-clean'
    ) {
      return;
    }
    this.dialogOpen.set(true);
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
        this.dialogOpen.set(false);
        if (confirmed) {
          this.persist(this.api.deleteContent(post.id, post.version), true);
        }
      });
  }
  //#endregion

  //#region methods / update input
  private updateInput(post: TaonCmsContentEntity): TaonCmsUpdateContent {
    return {
      ...this.draft(),
      relatedPostIds: this.relatedPosts().map(related => related.id),
      ...(this.permissionSource()
        ? {}
        : {
            permissionIds: this.permissions().map(permission => permission.id),
          }),
      applyPermissionsToRelatedPosts: this.applyPermissionsToRelatedPosts(),
      applicationHook: this.useAsApplicationHook()
        ? this.selectedApplicationHook()
        : null,
      expectedVersion: post.version,
    };
  }
  //#endregion

  //#region methods / require post
  private requirePost(): TaonCmsContentEntity | null {
    const post = this.currentPost();
    if (!post) {
      this.error.set(this.t.gettext('No post is loaded.'));
    }
    return post;
  }
  //#endregion

  //#region methods / set post
  private setPost(post: TaonCmsContentEntity | null): void {
    this.relatedPostsLoad?.unsubscribe();
    this.applicationHooksLoad?.unsubscribe();
    this.permissionsLoad?.unsubscribe();
    this.relatedPostsLoading.set(false);
    this.relatedPostsError.set('');
    this.applicationHooksLoading.set(false);
    this.applicationHooksError.set('');
    this.permissionsLoading.set(false);
    this.permissionsError.set('');
    this.uploadedMediaPreview.set(null);
    this.mediaPreviewSignature = '';
    this.mediaPreviewRequest += 1;
    this.currentPost.set(post);
    this.relatedPosts.set(post?.relatedPosts ?? []);
    this.permissions.set(post?.permissions ?? []);
    this.permissionSource.set(null);
    this.applyPermissionsToRelatedPosts.set(
      post?.applyPermissionsToRelatedPosts ?? false,
    );
    this.selectedPermissionId.set(null);
    this.setApplicationHookSelection(post, this.applicationHooks());
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
    if (
      post &&
      post.relatedPosts === undefined &&
      this.mode() !== 'view-clean'
    ) {
      this.loadRelatedPosts();
    }
    if (post && this.mode() !== 'view-clean') {
      this.loadPermissions();
    }
  }
  //#endregion

  private setApplicationHookSelection(
    post: TaonCmsContentEntity | null,
    hooks: TaonCmsApplicationHookEntity[],
  ): void {
    const assignedHook =
      post?.applicationHook !== undefined
        ? post.applicationHook?.hook
        : hooks.find(applicationHook => applicationHook.contentId === post?.id)
            ?.hook;
    this.useAsApplicationHook.set(!!assignedHook);
    this.selectedApplicationHook.set(assignedHook ?? null);
  }

  //#region methods / accept post
  private acceptPost(post: TaonCmsContentEntity): void {
    this.setPost(post);
    this.error.set('');
    this.mode.set('view');
    this.changed.emit(post);
  }
  //#endregion

  //#region methods / persist
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
            this.t.gettext(
              'The post could not be saved. Check the slug and your connection. If another user changed it, close and reopen the post before retrying.',
            ),
          );
        },
      });
  }
  //#endregion
}
