export {};

declare global {
  interface Window {
    coral: {
      platform: NodeJS.Platform;
      versions: {
        electron: string;
        chrome: string;
        node: string;
      };
    };
  }
}
