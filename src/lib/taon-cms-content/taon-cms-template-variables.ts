export interface TaonCmsTemplateContext {
  frontendUrl?: string | null;
  site?: { name?: string | null } | null;
  post?: {
    title?: string | null;
    url?: string | null;
    id?: number | null;
    thumbnailUrl?: string | null;
  } | null;
}

export type TaonCmsTemplateVariable =
  | 'frontendUrl'
  | 'site.name'
  | 'currentYear'
  | 'post.title'
  | 'post.url'
  | 'post.id'
  | 'post.thumbnailUrl';

/**
 * Resolves allowlisted values as HTML text/attribute data, not markup.
 * The returned HTML must still pass through the renderer's HTML sanitizer.
 */
export function resolveTemplateVariables(
  content: string | null | undefined,
  context: TaonCmsTemplateContext,
): string {
  const values = new Map<string, string | number | null | undefined>([
    ['frontendUrl', context.frontendUrl],
    ['site.name', context.site?.name],
    ['currentYear', new Date().getFullYear()],
    ['post.title', context.post?.title],
    ['post.url', context.post?.url],
    ['post.id', context.post?.id],
    ['post.thumbnailUrl', context.post?.thumbnailUrl],
  ]);
  return (content ?? '').replace(
    /\{\{\s*([a-zA-Z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)*)\s*\}\}/g,
    (placeholder: string, name: string) => {
      const value = values.get(name);
      if (value === null || value === undefined) {
        return placeholder;
      }
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },
  );
}
