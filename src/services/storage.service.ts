import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly DB_NAME = 'ShrDshbDB';
  private readonly STORE_NAME = 'files';
  private readonly DB_VERSION = 1;

  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.initDB();
  }

  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          db.createObjectStore(this.STORE_NAME);
        }
      };
    });
  }

  async saveData(fileName: string, csvText: string, images: Map<string, string>): Promise<void> {
    const db = await this.dbPromise;
    
    // Convert Image Map (URLs) back to Blobs for storage is tricky since we only have URLs.
    // However, in the updated flow, we will pass the Files directly to this service before creating URLs,
    // OR we fetch the blob from the blob URL (since it is local).
    
    const imageBlobs: {name: string, blob: Blob}[] = [];
    
    for (const [name, url] of images.entries()) {
      try {
        const res = await fetch(url);
        const blob = await res.blob();
        imageBlobs.push({ name, blob });
      } catch (e) {
        console.warn(`Could not save image ${name}`, e);
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);

      store.put(fileName, 'fileName');
      store.put(csvText, 'csvText');
      store.put(imageBlobs, 'images');

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async loadData(): Promise<{ fileName: string, csvText: string, imageMap: Map<string, string> } | null> {
    const db = await this.dbPromise;
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      
      const reqFileName = store.get('fileName');
      const reqCsv = store.get('csvText');
      const reqImages = store.get('images');

      transaction.oncomplete = () => {
        if (!reqCsv.result) {
          resolve(null);
          return;
        }

        const images: {name: string, blob: Blob}[] = reqImages.result || [];
        const map = new Map<string, string>();
        
        // Recreate Object URLs
        images.forEach(img => {
          const url = URL.createObjectURL(img.blob);
          map.set(img.name, url);
        });

        resolve({
          fileName: reqFileName.result || 'Restored File',
          csvText: reqCsv.result,
          imageMap: map
        });
      };
      
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async clearData(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      store.clear();
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}