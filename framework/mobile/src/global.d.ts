// URLSearchParams is available in React Native but not included in @react-native/typescript-config
// This declaration provides the types we need without pulling in full DOM types
type URLSearchParams = {
  append(name: string, value: string): void;
  delete(name: string): void;
  get(name: string): string | null;
  getAll(name: string): string[];
  has(name: string): boolean;
  set(name: string, value: string): void;
  toString(): string;
  forEach(callback: (value: string, key: string, parent: URLSearchParams) => void): void;
};

declare const URLSearchParams: {
  prototype: URLSearchParams;
  new (init?: string | Record<string, string> | string[][] | URLSearchParams): URLSearchParams;
};
