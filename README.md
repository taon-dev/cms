# cms

## Assets UI

The CMS Assets page lists existing files using
`TaonCmsContentStorageController.list({})`, without an assets repository or
separate listing endpoint. The shared `taon-datatable` displays ID (`key`),
File Name (`fileName`), and Content Type (`contentType`), with client-side
search, sorting, and pagination. Reload assets fetches the current storage list.

Expanding a row requests a fresh five-minute signed URL through the existing
storage controller's `getPrivateUrl`. Video and audio MIME types use native
players with controls; other types display a download link labeled with the
original filename (or the key when no filename is stored). Attachments use
`download=true` so the streaming endpoint returns attachment disposition.
Files are never fetched as blobs or buffered by the page. Collapsing a row
destroys its preview/player. Listing and private URL issuance require the same
authenticated `toManagePosts` permission as CMS uploads. Failed list, URL, and
playback operations display errors with reload/retry controls.

## Categories and Tags

CMS navigation includes separate `/cms/categories` and `/cms/tags` management
pages, each with its own searchable/sortable `taon-datatable` and create, edit,
and delete actions. Both resources have a name, unique slug, and description.
Categories additionally have an integer sort order and an optional parent.
The category parent selector excludes the current category and its descendants;
the backend also validates missing parents, self-parenting, and indirect cycles
inside a serializable transaction. Tags are flat and also require unique names.

The pages use `TaonCmsCategoryController.getAll/saveCategory/deleteCategory` and
`TaonCmsTagController.getAll/saveTag/deleteTag` through their existing Angular
API services. All operations require the same authenticated `toManagePosts`
access as Posts and Assets. Deleting a category still used by a post or child
category, or a tag still assigned to a post, is rejected. Reassign/remove those
references first; deletion never silently changes posts.

New/Edit Post has one nullable Category selector and searchable Tags with
removable selected chips. Save/Publish sends `categoryId` and `tagIds` through
the existing content API. Tag assignments remain rows in
`TaonCmsContentTagEntity`, not strings on the post. Cancel discards selections;
reopening the editor loads current assignments with `listTagIds`. Existing
content revision, duplication, and restore semantics apply to both resources.

## Post thumbnails

New/Edit Post includes Thumbnail above Related Posts, with a preview, Upload
Thumbnail, and Apply Default Placeholder. Uploaded/generated images use the same
`TaonCmsContentStorageController` upload API and configured storage provider as
other media. Posts store only `thumbnailKey`; image data is never stored in the
content entity. Thumbnail keys are saved, duplicated, and revisioned alongside
the other content fields. Cancel discards draft changes without deleting assets
needed by revisions or other posts.

Every successful video upload/replacement triggers browser-native extraction
from that selected `File`. An object URL feeds a native video element; a small
64-pixel-wide canvas checks luminance at 0.25-second intervals over at most the
first five seconds. A frame is usable when at least 2% of its pixels have
luminance above 18, allowing small subjects in dark scenes. If none qualifies,
the most visible scanned frame is used. The selected frame is encoded as WebP
(or the browser's supported fallback), at up to 1280×720 while preserving aspect
ratio, then uploaded as an ordinary CMS image asset. Video object URLs are
always revoked; extraction never uses `file.arrayBuffer()`, FFmpeg, or backend
video processing.

Every video re-upload replaces the current thumbnail, including a manual
override. Unrelated field edits never trigger extraction. Upload Thumbnail can
override the result at any time. Local image previews appear before upload
finishes, and their object URLs are released on replacement, cancellation, or
editor destruction. A generation failure keeps the uploaded video and reports
how to choose a manual/default thumbnail.

Defaults are reusable `cms-placeholder:<post-type>` references, rendered as
clean inline SVG illustrations for normal, video, audio, and attachment posts;
they do not create duplicate storage objects. Stored image thumbnails use the
same permission/publication checks and signed-download policy as other media,
including when assets are shared by multiple posts.

Run migration `CmsContext_1793043000000_postThumbnails` for an existing database.
It adds the nullable `thumbnailKey` column; old posts and snapshots remain
compatible. New UI and validation messages follow the existing gettext
conventions, with English, Polish, and German PO catalogs.

Focused regression tests:

```sh
npx --no-install vitest run src/tests/taon-cms-thumbnail.spec.ts src/tests/taon-cms-taxonomy.spec.ts src/tests/taon-cms-post.spec.ts
```

## Posts UI

`TaonCmsPostsBackofficeComponent` displays posts in `taon-datatable`.
Create navigates to `/cms/posts/new`, reusing `TaonCmsPostComponent` in `add`
mode without an ID. Saving opens the created post; cancelling returns to the
list. `/cms/posts/:id` loads an existing post with its current view/edit controls.
The list uses `getAll` with the datatable's client-side filtering, sorting,
and pagination; archived posts remain visible so they can be restored.

The list's Duplicate icon and the post's Duplicate button (after Delete) call
the same `duplicateContent` backend operation and open the new post. Duplication
preserves normal fields, tags, publication state, and all existing media keys
and body attachment references without copying or uploading files. It clears
related posts and application hooks, regenerates ID/version/timestamps, and
records an initial revision. Assigned read permissions and the inheritance flag
are preserved; an inherited effective permission set becomes independently
assigned because related links are not copied. Titles/slugs receive matching
` COPY<n>` / `-copy<n>` suffixes, skipping collisions in either field. Copying a
copy removes existing copy suffixes and advances the number.

Use the post component with a content entity returned by the API:

```html
<taon-cms-post
  [post]="post"
  mode="view"
  (changed)="post = $event" />
<taon-cms-post
  mode="add"
  (changed)="onCreated($event)" />
<taon-cms-post
  [post]="post"
  mode="view-clean" />
```

Modes are `view`, `edit`, `add`, and `view-clean`. The public `view-clean`
mode has no management controls. `changed` emits the entity returned by the
backend, `deleted` reports archiving, `duplicated` emits the newly created copy
for the host to open, and `cancelled` reports cancellation.
`mode` supports two-way binding.

The editor uses contenteditable title/excerpt/body fields instead of a body
textarea. The body is HTML, rendered with Angular sanitization; pasted text is
inserted without external markup. A URL slug is required by the create API and
is editable below the article. Saving or publishing uses the current entity
version; publishing while editing saves the draft and publishes in one request.

The Material radio selector above the title selects `TaonCmsContentType.Normal`,
`Video`, `Audio`, or `Attachment`. New posts default to `Normal`. Video, audio,
and attachment posts show a primary-media upload section directly below the URL
slug. Uploads use `TaonCmsContentStorageController` (Taon's bucket storage) and
store the returned key in `videoKey`, `audioKey`, or `attachmentKey`, never in
`body`. The editor previews video/audio with native controls and shows an
attachment filename with a download/open action. Existing media can be replaced
or removed.

Changing type only changes which media section is visible; all keys and files
are retained. Uploads, Replace, and Remove change the draft; Save/Publish
persists the keys, and Cancel discards draft changes. Remove clears only the
selected key, not the stored file, so revision history remains usable. Files
uploaded to discarded drafts are also retained. Upload failures display an
error and keep the draft intact.

All post uploads (including Replace) display a determinate Material progress bar
and the actual transferred percentage, starting at 0%. An XHR transport adapter
adds browser upload events to the existing Taon request pipeline and storage
upload endpoint; authentication middleware, retries, and response decoding stay
in that pipeline. 100% transferred is not treated as server success: the draft
key changes only after a valid successful response. Failure clears progress,
shows an error, and retains the previous file. Upload state resets after every
attempt. Both Assets and Post video/audio players use `preload="none"` and direct
storage URLs: rendering a preview does not initiate media downloading. Manual
playback still uses the storage endpoint's existing HTTP Range support.

Publish and Unpublish are mutually exclusive. Unpublish sends a version-checked
partial update with `status: 'draft'` only. It does not save unsaved editor
changes, restore content, delete files, or remove revisions; publication history
and the previous publication timestamp are retained. Public hook reads, media
URL issuance, and unsigned storage downloads check the current publication state.

`TaonCmsContentApiService` exposes private and public
`getVideoLinkBySlug`/`getPublicVideoLinkBySlug`,
`getAudioLinkBySlug`/`getPublicAudioLinkBySlug`, and
`getAttachmentLinkBySlug`/`getPublicAttachmentLinkBySlug` methods. Private URL
issuance checks the post's assigned permission codes (or super-user access);
public URL issuance is limited to published posts without permissions. Private
download URLs are signed, key- and storage-controller-bound tokens that expire
after five minutes; no temporary-link database or KV records are created.
Storage downloads validate these tokens and support streamed HTTP Range
requests for video/audio. Node storage persists content type and original
filename metadata alongside the object; Cloudflare R2 stores the same metadata
with the object.

Below the media section, the related-post list shows IDs and titles with remove
buttons. Add related post opens `TaonRelatedPostChooserComponent`
(`taon-related-post-chooser`), with search by ID, title, or slug. The current post
and already selected posts are excluded. Links are one-way and changes are staged
until Save or Publish; Cancel discards them, including on new posts.

Below **Allow Read only with Permissions**, **Apply permissions to related posts**
enables live permission inheritance along this post's outgoing related links.
It defaults to off. Related posts show the effective permissions using the
existing chooser, disable permission changes, and identify the source post.
Changing the source's permissions immediately affects subsequent backend access
checks; no inherited permission IDs are copied to children. Existing independent
permissions remain dormant while inheritance is active and become effective
again when the source disables inheritance or removes the related link.
Inheritance is transitive: a child passing permissions to its own related posts
passes its effective source permissions.

Related links remain a general many-to-many graph. Only enabled inheritance
edges must form a forest: multiple sources for a child and inheritance cycles
fail with HTTP 409. Create, update, related-link mutations, and restore validate
this graph transactionally at serializable isolation. Attempts to change a
child's independent permission IDs while it inherits also fail with HTTP 409.
The backend resolves effective permissions for hook content, media URL issuance,
and public storage policy. Super-user access retains its existing bypass.
`listPermissions(id)` returns effective permissions;
`getPermissionConfiguration(id)` additionally identifies the live source.
Create/update accept `applyPermissionsToRelatedPosts`, which is also revisioned.
Older snapshots preserve the current flag when it was not yet stored.
Run `CmsContext_1792579000000_postPermissionInheritance` (registered in the CMS
migration exports) before deployment to add the boolean column with default
false. A deployment using schema synchronization can create it from the entity.

Revert opens `TaonCmsRevisionChooserComponent`, which lists revisions through
`TaonCmsContentRevisionApiService.listRevisions` and restores through
`restoreContent`. The service calls the existing content-controller endpoints;
no revision snapshots are copied in the UI. Legacy revisions without a complete
snapshot are shown but cannot be selected. Failed operations keep the editor or
revision dialog open and show an error.

Run `node --test src/tests/cms-posts.test.cjs` for the focused Posts regression
suite using the workspace's existing TypeScript, TypeORM, SQL.js, RxJS, and Angular
dependencies. It exercises actual SQLite transactions/relations, inheritance and
rollback, publication/access policy, upload events and failures, and editor state.
Editor tests use real Angular signals with mocked injection, not a rendered
TestBed DOM. The test loader transpiles the isomorphic sources without launching
a Taon application.

## Content API

`TaonCmsContentApiService` exposes Observable-based methods:

```ts
api.createContent({
  type: TaonCmsContentType.Normal,
  title: 'Hello',
  slug: 'hello',
  body: 'Post content',
  categoryId: 1,
  tagIds: [1, 2],
});
api.updateContent(id, { title: 'Updated', expectedVersion: post.version });
api.listRevisions(id);
api.restoreContent(id, { revisionNumber: 1, expectedVersion: post.version });
api.deleteContent(id, post.version);
api.listRelatedPosts(id);
api.addRelatedPost(id, relatedPostId, post.version);
api.deleteRelatedPost(id, relatedPostId, post.version);
```

Subscribe to execute each request. Creation starts at version 1 and saves a
complete revision. Updates and restores increment the version and save a new
revision. Send the current `version` as `expectedVersion`; stale edits fail with
HTTP 409 instead of overwriting another edit. Existing version-0 posts can be
updated and their previous state is recorded before replacement.

Updates are partial: omitted fields are preserved; `null` clears nullable fields,
and `tagIds: []` removes all tag links. Category and tag IDs must already exist.
The content type is optional on creation and defaults to `TaonCmsContentType.Normal`;
explicit types must be enum values. Primary media keys accept strings or `null`
and are included in revision snapshots. Restoring a complete snapshot from before
primary-media support preserves the current media keys.
Create/update also accept `relatedPostIds`. Omission preserves links on update;
`relatedPostIds: []` clears them. IDs must exist, self-links are rejected, and
duplicates are deduplicated. Related-post mutations return the updated post with
its `relatedPosts` array and use the same version checks and revision history.
`listRelatedPosts` loads live related entities without recursively loading their
own links. Removing a link never archives or deletes either post.
Slug conflicts fail with HTTP 409; missing content, categories, tags, or revisions
fail with HTTP 404. Invalid input fails with HTTP 400.

Deletion **archives** the post and creates a revision; it does not delete the
post, revisions, assets, comments, permissions, shared categories/tags, or stored
files. Existing `getAll` behavior remains unchanged and includes archived posts.
Restoring copies all editable post fields (including status and publication date),
category, tag links, and related-post links; it preserves the post ID and creation
date and leaves assets, comments, and permissions unchanged. All writes are
transactional. Complete snapshots created before related-post support restore
with no related links.

Older revisions containing only title/body have no complete snapshot and cannot
be fully restored (HTTP 409). The nullable `snapshot` column must be added through
your deployment's schema synchronization/migration before using this API.
Related posts also require the `taon_cms_related_posts` join table, created by
schema synchronization/migration from `TaonCmsContentEntity`'s relation metadata.
Primary media also requires nullable varchar columns `videoKey`, `audioKey`, and
`attachmentKey`, and the type column's default is now `normal`. Migrate legacy
`article` types to `normal` and `file` types to `attachment` in existing content
and revision snapshots before using enum-validated writes/restores.

The content context includes its category, tag, content-tag, and revision
dependencies. Assets, comments, and permissions need no new repository operations
for archive-based deletion. Media uses the post's existing permissions; it does
not add separate video, audio, or attachment permissions. The content storage
controller exposes only uploads and token/public-policy-validated downloads;
physical file deletion remains unavailable through this controller.
 
