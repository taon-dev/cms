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

import { TaonCmsContentRevisionEntity } from './taon-cms-content-revision.entity';
import { TaonCmsContentRevisionRepository } from './taon-cms-content-revision.repository';
//#endregion

@TaonController<TaonCmsContentRevisionController>({
  className: 'TaonCmsContentRevisionController',
  allowedMethods: [],
})
export class TaonCmsContentRevisionController extends TaonBaseCrudController<TaonCmsContentRevisionEntity> {
  entityClassResolveFn: () => typeof TaonCmsContentRevisionEntity = () =>
    TaonCmsContentRevisionEntity;

  taonCmsContentRevisionRepository = this.injectCustomRepo(
    TaonCmsContentRevisionRepository,
  );
}
