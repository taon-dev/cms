import { TaonCmsContentRevisionState } from './taon-cms-content-revision.models';

export namespace TaonCmsContentRevisionUtils {
  export function isActive(state: string): state is TaonCmsContentRevisionState {
    return state === 'active';
  }
}