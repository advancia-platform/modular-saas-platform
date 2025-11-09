export {};

declare global {
  interface Window {
    smartsupp?: ((...args: unknown[]) => void) | undefined;
    _smartsupp?: { key?: string } | undefined;
  }
}
