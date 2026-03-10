export {};

declare global {
  interface Window {
    vibeKanban?: {
      focusAppWindow: () => void;
    };
  }
}
