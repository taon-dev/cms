import { TaonCmsTagState } from './taon-cms-tag.models';

export namespace TaonCmsTagUtils {
  export function isActive(state: string): state is TaonCmsTagState {
    return state === 'active';
  }
}