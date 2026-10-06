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

import { TaonCmsContentTagEntity } from './taon-cms-content-tag.entity';
import { TaonCmsContentTagRepository } from './taon-cms-content-tag.repository';
//#endregion

@TaonController<TaonCmsContentTagController>({
  className: 'TaonCmsContentTagController',
  allowedMethods: [],
})
export class TaonCmsContentTagController extends TaonBaseCrudController<TaonCmsContentTagEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentTagEntity = () =>
    TaonCmsContentTagEntity;

  taonCmsContentTagRepository = this.injectCustomRepo(
    TaonCmsContentTagRepository,
  );
}
