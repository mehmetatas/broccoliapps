import RNFS from "react-native-fs";

const BASE_URL = "https://www.serophin.com/static/audio";
const AUDIO_DIR = `${RNFS.DocumentDirectoryPath}/audio`;

const ensuredDirs = new Set<string>();

const ensureDir = async (dir: string) => {
  if (ensuredDirs.has(dir)) {
    return;
  }
  const exists = await RNFS.exists(dir);
  if (!exists) {
    await RNFS.mkdir(dir);
  }
  ensuredDirs.add(dir);
};

export const ensureAudioFile = async (filename: string) => {
  const path = `${AUDIO_DIR}/${filename}`;
  const exists = await RNFS.exists(path);
  if (!exists) {
    // Ensure all parent directories exist (e.g., audio/meditation/)
    const lastSlash = path.lastIndexOf("/");
    await ensureDir(path.substring(0, lastSlash));
    await RNFS.downloadFile({
      fromUrl: `${BASE_URL}/${filename}`,
      toFile: path,
    }).promise;
  }
  return path;
};

/** Returns local path only if file already exists on disk, null otherwise (no download). */
export const getLocalAudioFile = async (filename: string): Promise<string | null> => {
  const path = `${AUDIO_DIR}/${filename}`;
  const exists = await RNFS.exists(path);
  return exists ? path : null;
};

const collectFiles = async (dir: string): Promise<RNFS.ReadDirItem[]> => {
  const exists = await RNFS.exists(dir);
  if (!exists) {
    return [];
  }
  const items = await RNFS.readDir(dir);
  const results: RNFS.ReadDirItem[] = [];
  for (const item of items) {
    if (item.isDirectory()) {
      results.push(...(await collectFiles(item.path)));
    } else {
      results.push(item);
    }
  }
  return results;
};

export const getAudioCacheInfo = async (): Promise<{ fileCount: number; totalBytes: number }> => {
  const files = await collectFiles(AUDIO_DIR);
  const totalBytes = files.reduce((sum, f) => sum + (f.size ?? 0), 0);
  return { fileCount: files.length, totalBytes };
};

export const clearAudioCache = async () => {
  const exists = await RNFS.exists(AUDIO_DIR);
  if (exists) {
    await RNFS.unlink(AUDIO_DIR);
  }
  ensuredDirs.clear();
};

const BATCH_SIZE = 4;

export const preDownloadGuidanceAudio = async (filenames: string[]) => {
  for (let i = 0; i < filenames.length; i += BATCH_SIZE) {
    const batch = filenames.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map((f) => ensureAudioFile(f).catch(() => {})));
  }
};
