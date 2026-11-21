// Global type augmentations for Have2Want Plus
// These types are declared in a .d.ts file to avoid JSX/TS parsing issues in .jsx files

interface PiAdsInterface {
  showRewardedVideo: (options: {
    onReward: () => void;
    onError: (error: Error) => void;
    onClose: () => void;
  }) => Promise<void>;

  showInterstitial: (options: {
    onClose: () => void;
    onError: (error: Error) => void;
  }) => Promise<void>;

  isRewardedVideoAvailable: () => Promise<boolean>;
  isInterstitialAvailable: () => Promise<boolean>;
}

interface PiNetworkSDK {
  init: (options: { version: string; sandbox?: boolean }) => void;
  authenticate: (
    scopes: string[],
    onIncompletePaymentFound?: (payment: any) => void
  ) => Promise<{
    accessToken: string;
    user: { uid: string; username: string };
  }>;
  createPayment: (paymentData: any, callbacks?: any) => Promise<any>;
  Ads?: PiAdsInterface;
}

declare global {
  interface Window {
    Pi?: PiNetworkSDK;
  }
}

export {};