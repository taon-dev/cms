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

Revert opens `TaonCmsRevisionChooserComponent`, which lists revisions through
`TaonCmsContentRevisionApiService.listRevisions` and restores through
`restoreContent`. The service calls the existing content-controller endpoints;
no revision snapshots are copied in the UI. Legacy revisions without a complete
snapshot are shown but cannot be selected. Failed operations keep the editor or
revision dialog open and show an error.

Focused Angular/Jasmine specs accompany the post, revision chooser, and
backoffice components and use the existing generated Angular library test setup.

## Content API

`TaonCmsContentApiService` exposes Observable-based methods:

```ts
api.createContent({
  type: 'article',
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
```

Subscribe to execute each request. Creation starts at version 1 and saves a
complete revision. Updates and restores increment the version and save a new
revision. Send the current `version` as `expectedVersion`; stale edits fail with
HTTP 409 instead of overwriting another edit. Existing version-0 posts can be
updated and their previous state is recorded before replacement.

Updates are partial: omitted fields are preserved; `null` clears nullable fields,
and `tagIds: []` removes all tag links. Category and tag IDs must already exist.
Slug conflicts fail with HTTP 409; missing content, categories, tags, or revisions
fail with HTTP 404. Invalid input fails with HTTP 400.

Deletion **archives** the post and creates a revision; it does not delete the
post, revisions, assets, comments, permissions, shared categories/tags, or stored
files. Existing `getAll` behavior remains unchanged and includes archived posts.
Restoring copies all editable post fields (including status and publication date),
category, and tag links; it preserves the post ID and creation date and leaves
assets, comments, and permissions unchanged. All writes are transactional.

Older revisions containing only title/body have no complete snapshot and cannot
be fully restored (HTTP 409). The nullable `snapshot` column must be added through
your deployment's schema synchronization/migration before using this API.

The content context includes its category, tag, content-tag, and revision
dependencies. Assets, comments, and permissions need no new repository operations
for archive-based deletion. Apply your application's authorization middleware to
these endpoints; this API does not add a new permission policy.

Run the focused TypeORM SQL.js integration tests with `npm run test:content`
after Taon generates the package configuration, or directly with
`vitest run --config vitest.content.config.ts`. The source-test configuration
mocks Taon's context injection and uses the real entities and TypeORM database.
