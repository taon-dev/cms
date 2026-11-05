import { TaonCmsContentState } from './taon-cms-content.models';
import type { TaonCmsContentEntity } from './taon-cms-content.entity';

export namespace TaonCmsContentUtils {
  export function orderRelatedPosts(
    posts: TaonCmsContentEntity[],
    ids: number[],
  ): void {
    const positions = new Map(ids.map((id, index) => [id, index]));
    posts.sort((a, b) =>
      (positions.get(a.id) ?? ids.length) -
      (positions.get(b.id) ?? ids.length),
    );
  }

  export function isActive(state: string): state is TaonCmsContentState {
    return state === 'active';
  }
}