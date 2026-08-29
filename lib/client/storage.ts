export interface SavedGeneration {
  id: string;
  createdAt: number;
  name: string;
  size: string;
  model: string;
  aspectRatio: string;
  backgroundStyle: string;
  cards: Record<string, { base64: string; mimeType: string }>;
}

const DB_NAME = "marketplace_generator_db";
const STORE_NAME = "generations";
const DB_VERSION = 1;
const MAX_SAVED = 10;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      return reject(new Error("IndexedDB no disponible."));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveGeneration(item: Omit<SavedGeneration, "id" | "createdAt">): Promise<SavedGeneration> {
  const db = await openDB();
  const newItem: SavedGeneration = {
    ...item,
    id: `gen_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    createdAt: Date.now(),
  };

  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.put(newItem);

  await new Promise((res, rej) => {
    tx.oncomplete = res;
    tx.onerror = rej;
  });

  await pruneHistory();
  return newItem;
}

export async function getGenerations(): Promise<SavedGeneration[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
      request.onsuccess = () => {
        const list = (request.result as SavedGeneration[]) || [];
        list.sort((a, b) => b.createdAt - a.createdAt);
        resolve(list);
      };
      request.onerror = () => reject(request.error);
    });
  } catch {
    return [];
  }
}

export async function deleteGeneration(id: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  store.delete(id);
  return new Promise((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = rej;
  });
}

async function pruneHistory(): Promise<void> {
  const all = await getGenerations();
  if (all.length > MAX_SAVED) {
    const toDelete = all.slice(MAX_SAVED);
    for (const item of toDelete) {
      await deleteGeneration(item.id);
    }
  }
}
