# cms

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
