import { TaonAuthorizationSchema } from '@taon-dev/session/src';

export enum MyAppGroup {
  Administrator = 'administrator',
  Customers = 'customers',
}

export enum MyAppRole {
  MangePosts = 'manage-posts',
  Customer = 'Customer',
  CustomerPremium = 'CustomerPremium',
  BlogReader = 'BlogReader',
}

export enum MyAppPermission {
  AccessToAllEmails = 'AccessToAllEmails',
  AccessCourseP1 = 'AccessCourseP1',
  AccessCourseP2 = 'AccessCourseP2',
  AccessCoursePremium = 'AccessCoursePremium',
}

export interface MyAppAuthorization extends TaonAuthorizationSchema {
  group: MyAppGroup;
  role: MyAppRole;
  permission: MyAppPermission;
}
