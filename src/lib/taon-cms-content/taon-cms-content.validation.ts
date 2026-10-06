import { Taon } from 'taon/src';

import type { TaonCmsContentFields } from './taon-cms-content.models';

export function contentError(message: string, status = 400): never {
  Taon.error({ message, status });
  throw new Error(message);
}

export function requireContentId(value: number, name = 'contentId'): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    contentError(`${name} must be a positive integer.`);
  }
}

export function requireContentVersion(
  value: number,
  name = 'expectedVersion',
): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    contentError(`${name} must be a non-negative integer.`);
  }
}

export function validateContentInput(
  input: Partial<TaonCmsContentFields> & { tagIds?: number[] },
  creating = false,
): void {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    contentError('Content must be an object.');
  }
  for (const field of ['type', 'title', 'slug'] as const) {
    if (creating || input[field] !== undefined) {
      if (typeof input[field] !== 'string' || !input[field].trim()) {
        contentError(`${field} must be a non-empty string.`);
      }
    }
  }
  for (const field of ['body', 'excerpt'] as const) {
    if (
      input[field] !== undefined &&
      input[field] !== null &&
      typeof input[field] !== 'string'
    ) {
      contentError(`${field} must be a string or null.`);
    }
  }
  for (const field of ['categoryId', 'authorUserId'] as const) {
    if (input[field] !== undefined && input[field] !== null) {
      requireContentId(input[field], field);
    }
  }
  if (
    input.status !== undefined &&
    !['draft', 'published', 'archived'].includes(input.status)
  ) {
    contentError('status must be draft, published, or archived.');
  }
  if (input.publishedAt !== undefined && input.publishedAt !== null) {
    if (
      !(
        input.publishedAt instanceof Date ||
        typeof input.publishedAt === 'string'
      ) ||
      Number.isNaN(new Date(input.publishedAt).getTime())
    ) {
      contentError('publishedAt must be a valid date or null.');
    }
  }
  if (input.tagIds !== undefined) {
    if (!Array.isArray(input.tagIds)) {
      contentError('tagIds must be an array.');
    }
    for (const id of input.tagIds) {
      requireContentId(id, 'tagId');
    }
  }
}
