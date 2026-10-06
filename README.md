# cms

## Posts UI

`TaonCmsPostsBackofficeComponent` displays posts in `taon-datatable`, with
add/edit actions opening a fullscreen `TaonCmsPostEditDialogComponent`.
The dialog delegates all rendering and editing to `TaonCmsPostComponent`.
The table reloads after each successful create, save, publish, restore, or
archive. It uses `getAll` with the datatable's client-side filtering, sorting,
and pagination; archived posts remain visible so they can be restored.

Use the post component with a content entity returned by the API:

```html
<taon-cms-post [post]="post" mode="view" (changed)="post = $event" />
<taon-cms-post mode="add" (changed)="onCreated($event)" />
<taon-cms-post [post]="post" mode="view-clean" />
```

Modes are `view`, `edit`, `add`, and `view-clean`. The public `view-clean`
mode has no management controls. `changed` emits the entity returned by the
backend, `deleted` reports archiving, and `cancelled` reports cancellation.
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
`body`. The attached file's key is shown once uploaded.

Changing type only changes which media section is visible; all keys and files
are retained. Uploads and Remove change the draft; Save/Publish persists the
keys, and Cancel discards draft changes. Remove clears only the selected key,
not the stored file, so revision history remains usable. Files uploaded to
discarded drafts are also retained. Upload failures display an error and keep
the draft intact.

Below the media section, the related-post list shows IDs and titles with remove
buttons. Add related post opens `TaonRelatedPostChooserComponent`
(`taon-related-post-chooser`), with search by ID, title, or slug. The current post
and already selected posts are excluded. Links are one-way and changes are staged
until Save or Publish; Cancel discards them, including on new posts.

Revert opens `TaonCmsRevisionChooserComponent`, which lists revisions through
`TaonCmsContentRevisionApiService.listRevisions` and restores through
`restoreContent`. The service calls the existing content-controller endpoints;
no revision snapshots are copied in the UI. Legacy revisions without a complete
snapshot are shown but cannot be selected. Failed operations keep the editor or
revision dialog open and show an error.

Focused Vitest tests cover content defaults/validation, media persistence and
revision orchestration, uploads, and editor state/template wiring. Editor tests
use real Angular signals with mocked injection, not a rendered TestBed DOM.

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
for archive-based deletion. Apply your application's authorization middleware to
these endpoints; this API does not add a new permission policy.
Apply that policy to the content storage controller as well; it exposes upload,
download, existence, and metadata endpoints, not physical file deletion.

Run the focused content tests with `npm run test:content`
after Taon generates the package configuration, or directly with
`vitest run --config vitest.content.config.ts`. The source-test configuration
mocks Taon's context injection and storage transport, and tests the real content
repositories with an in-memory manager. These are unit tests, not SQL/ORM
metadata or end-to-end storage tests.
