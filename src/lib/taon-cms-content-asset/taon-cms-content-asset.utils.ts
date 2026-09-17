import { TaonCmsContentAssetState } from './taon-cms-content-asset.models';

export namespace TaonCmsContentAssetUtils {
  export function isActive(state: string): state is TaonCmsContentAssetState {
    return state === 'active';
  }
}