import * as fs from 'fs';
import * as path from 'path';
import { StorageProvider } from './StorageService';

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

export class LocalStorageService implements StorageProvider {
  constructor() {
    if (!fs.existsSync(UPLOADS_DIR)) {
      fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    }
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, mimetype: string): Promise<string> {
    const timestamp = Date.now();
    const uniqueFileName = `${timestamp}-${fileName}`;
    const filePath = path.join(UPLOADS_DIR, uniqueFileName);
    
    await fs.promises.writeFile(filePath, fileBuffer);
    return uniqueFileName; // Using filename as storageKey for local storage
  }

  async downloadFile(storageKey: string): Promise<Buffer> {
    const filePath = path.join(UPLOADS_DIR, storageKey);
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found in local storage');
    }
    return fs.promises.readFile(filePath);
  }

  async deleteFile(storageKey: string): Promise<void> {
    const filePath = path.join(UPLOADS_DIR, storageKey);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }
}
