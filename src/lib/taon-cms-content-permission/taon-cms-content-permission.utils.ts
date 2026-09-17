import { TaonCmsContentPermissionState } from './taon-cms-content-permission.models';

export namespace TaonCmsContentPermissionUtils {
  export function isActive(state: string): state is TaonCmsContentPermissionState {
    return state === 'active';
  }
}