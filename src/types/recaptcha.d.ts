export {};

declare global {
  interface Window {
    __recaptchaV2Onload?: () => void;
    grecaptcha?: {
      render: (
        container: HTMLElement,
        parameters: {
          sitekey: string;
          callback?: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark';
          size?: 'normal' | 'compact' | 'invisible';
        }
      ) => number;
      execute?: (siteKey: string, options: { action: string }) => Promise<string>;
      ready?: (callback: () => void) => void;
      reset: (widgetId?: number) => void;
    };
  }
}
