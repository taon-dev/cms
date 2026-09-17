import { TaonCmsContentTagState } from './taon-cms-content-tag.models';

export namespace TaonCmsContentTagUtils {
  export function isActive(state: string): state is TaonCmsContentTagState {
    return state === 'active';
  }
}