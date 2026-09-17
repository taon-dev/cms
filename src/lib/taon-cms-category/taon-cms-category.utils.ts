import { TaonCmsCategoryState } from './taon-cms-category.models';

export namespace TaonCmsCategoryUtils {
  export function isActive(state: string): state is TaonCmsCategoryState {
    return state === 'active';
  }
}