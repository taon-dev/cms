import { TaonCmsContentState } from './taon-cms-content.models';

export namespace TaonCmsContentUtils {
  export function isActive(state: string): state is TaonCmsContentState {
    return state === 'active';
  }
}