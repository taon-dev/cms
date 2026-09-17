//#region imports
import { TaonBaseSubscriberForEntity, TaonSubscriber } from 'taon/src';
import { TaonCmsCommentEntity } from './taon-cms-comment.entity';
import { TaonCmsCommentProvider } from './taon-cms-comment.provider';
//#endregion

@TaonSubscriber<TaonCmsCommentSubscriber>({
  className: 'TaonCmsCommentSubscriber',
  // allowedEvents: ['afterUpdate'],
})
export class TaonCmsCommentSubscriber extends TaonBaseSubscriberForEntity {
  taonCmsCommentProvider = this.injectProvider(TaonCmsCommentProvider);
  listenTo(): typeof TaonCmsCommentEntity {
    return TaonCmsCommentEntity;
  }
}