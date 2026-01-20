type StorageAreaName = "sync" | "local";

function getChromeStorageArea(area: StorageAreaName) {
  if (typeof chrome === "undefined" || !chrome.storage) return null;
  return area === "sync" ? chrome.storage.sync : chrome.storage.local;
}

export async function storageGet<T>(
  area: StorageAreaName,
  key: string
): Promise<T | undefined> {
  const chromeArea = getChromeStorageArea(area);
  if (chromeArea) {
    const result = await chromeArea.get(key);
    return result[key] as T | undefined;
  }

  try {
    const raw = localStorage.getItem(`${area}:${key}`);
    if (raw === null) return undefined;
    return JSON.parse(raw) as T;
  } catch {
    return undefined;
  }
}

export async function storageSet(
  area: StorageAreaName,
  key: string,
  value: unknown
): Promise<void> {
  const chromeArea = getChromeStorageArea(area);
  if (chromeArea) {
    await chromeArea.set({ [key]: value });
    return;
  }

  try {
    localStorage.setItem(`${area}:${key}`, JSON.stringify(value));
  } catch {
    return;
  }
}

