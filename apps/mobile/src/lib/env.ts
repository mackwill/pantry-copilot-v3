import { z } from 'zod';

const schema = z.object({
  EXPO_PUBLIC_API_URL: z.string().default('http://localhost:4000'),
  /** RevenueCat public SDK key for iOS — absent in Expo Go / dev (billing no-ops). */
  EXPO_PUBLIC_REVENUECAT_IOS_KEY: z.string().optional(),
  /** RevenueCat public SDK key for Android — absent in Expo Go / dev (billing no-ops). */
  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: z.string().optional(),
});

export const env = schema.parse({
  EXPO_PUBLIC_API_URL: process.env['EXPO_PUBLIC_API_URL'],
  EXPO_PUBLIC_REVENUECAT_IOS_KEY: process.env['EXPO_PUBLIC_REVENUECAT_IOS_KEY'],
  EXPO_PUBLIC_REVENUECAT_ANDROID_KEY: process.env['EXPO_PUBLIC_REVENUECAT_ANDROID_KEY'],
});
