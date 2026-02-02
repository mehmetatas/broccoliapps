import { createMMKV, MMKV } from "react-native-mmkv";

let _storage: MMKV | null = null;

export function getStorage(): MMKV {
  if (!_storage) {
    _storage = createMMKV();
  }
  return _storage;
}
