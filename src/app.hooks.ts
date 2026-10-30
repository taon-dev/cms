import { TaonCmsApplicationHook } from '@taon-dev/cms/src';

export const TaonCmsApplicationHookDecorator = {
  ...TaonCmsApplicationHook,
  ABOUT_ME_SHORT: 'about-me-short',
  ABOUT_ME_LONG: 'about-me-long',
  TIMETABLE: 'timetable',
} as const;

export type TaonCmsApplicationHookDecorator =
  (typeof TaonCmsApplicationHookDecorator)[keyof typeof TaonCmsApplicationHookDecorator];
