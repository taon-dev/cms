import { TaonCmsCommentState } from './taon-cms-comment.models';

export namespace TaonCmsCommentUtils {
  export function isActive(state: string): state is TaonCmsCommentState {
    return state === 'active';
  }
}