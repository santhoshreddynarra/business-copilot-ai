export interface StorageProvider {
  uploadFile(fileBuffer: Buffer, fileName: string, mimetype: string): Promise<string>;
  downloadFile(storageKey: string): Promise<Buffer>;
  deleteFile(storageKey: string): Promise<void>;
}
