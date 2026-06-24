import { prisma } from '../utils/prisma';
import { StorageProvider } from './StorageService';

export class DocumentService {
  constructor(private storageProvider: StorageProvider) {}

  async uploadDocument(
    userId: string,
    fileBuffer: Buffer,
    originalName: string,
    mimetype: string,
    sizeBytes: number,
    title?: string,
    description?: string
  ) {
    // 1. Save to physical storage
    const storageKey = await this.storageProvider.uploadFile(fileBuffer, originalName, mimetype);

    // 2. Persist to database in a transaction
    const document = await prisma.$transaction(async (tx) => {
      const doc = await tx.document.create({
        data: {
          userId,
          title: title || originalName,
          description,
          fileType: mimetype,
          sizeBytes,
          isProcessing: false, // We mark as false since we have no AI pipeline yet
        },
      });

      await tx.documentVersion.create({
        data: {
          documentId: doc.id,
          version: 1,
          storageKey,
          storageType: 'LOCAL',
          originalName,
        },
      });

      await tx.uploadJob.create({
        data: {
          documentId: doc.id,
          status: 'COMPLETED', // No processing step yet
          finishedAt: new Date(),
        },
      });

      return doc;
    });

    return document;
  }

  async listDocuments(userId: string) {
    return prisma.document.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        versions: {
          orderBy: { version: 'desc' },
          take: 1, // Only get the latest version info
        },
      },
    });
  }

  async getDocumentDetails(userId: string, documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: { orderBy: { version: 'desc' } },
        jobs: { orderBy: { startedAt: 'desc' } },
      },
    });

    if (!document || document.userId !== userId) {
      throw new Error('Document not found or access denied');
    }

    return document;
  }

  async deleteDocument(userId: string, documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { versions: true },
    });

    if (!document || document.userId !== userId) {
      throw new Error('Document not found or access denied');
    }

    // Delete physical files
    for (const version of document.versions) {
      await this.storageProvider.deleteFile(version.storageKey);
    }

    // Delete database records (Cascade will handle versions and jobs)
    await prisma.document.delete({ where: { id: documentId } });
  }

  async getDownloadBuffer(userId: string, documentId: string, versionId?: string) {
    const document = await this.getDocumentDetails(userId, documentId);
    
    let version = document.versions[0]; // default to latest
    if (versionId) {
      const found = document.versions.find(v => v.id === versionId);
      if (found) version = found;
    }

    if (!version) {
      throw new Error('Document version not found');
    }

    const fileBuffer = await this.storageProvider.downloadFile(version.storageKey);
    return {
      buffer: fileBuffer,
      originalName: version.originalName,
      mimetype: document.fileType,
    };
  }
}
