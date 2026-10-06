//#region imports
import {
  Taon,
  ClassHelpers,
  TaonController,
  TaonBaseCrudController,
  Query,
  GET,
} from 'taon/src';
import { _ } from 'tnp-core/src';

import { TaonCmsCategoryEntity } from './taon-cms-category.entity';
import { TaonCmsCategoryRepository } from './taon-cms-category.repository';
//#endregion

@TaonController<TaonCmsCategoryController>({
  className: 'TaonCmsCategoryController',
  allowedMethods: [],
})
export class TaonCmsCategoryController extends TaonBaseCrudController<TaonCmsCategoryEntity> {
  entityClassResolveFn: () => typeof TaonCmsCategoryEntity = () =>
    TaonCmsCategoryEntity;

  taonCmsCategoryRepository = this.injectCustomRepo(TaonCmsCategoryRepository);
}
