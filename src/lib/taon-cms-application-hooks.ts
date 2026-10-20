export const TaonCmsApplicationHook = {
  HOME_HERO: 'home-hero',
  HOME_FEATURED_POST: 'home-featured-post',
  SHOP_PROMOTION: 'shop-promotion',
  LOGIN_INFO: 'login-info',
  FOOTER_ABOUT: 'footer-about',
} as const;

export type TaonCmsApplicationHook =
  (typeof TaonCmsApplicationHook)[keyof typeof TaonCmsApplicationHook];
