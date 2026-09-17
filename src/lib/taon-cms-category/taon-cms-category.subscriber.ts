//#region imports
import { TaonBaseSubscriberForEntity, TaonSubscriber } from 'taon/src';
import { TaonCmsCategoryEntity } from './taon-cms-category.entity';
import { TaonCmsCategoryProvider } from './taon-cms-category.provider';
//#endregion

@TaonSubscriber<TaonCmsCategorySubscriber>({
  className: 'TaonCmsCategorySubscriber',
  // allowedEvents: ['afterUpdate'],
})
export class TaonCmsCategorySubscriber extends TaonBaseSubscriberForEntity {
  taonCmsCategoryProvider = this.injectProvider(TaonCmsCategoryProvider);
  listenTo(): typeof TaonCmsCategoryEntity {
    return TaonCmsCategoryEntity;
  }
}