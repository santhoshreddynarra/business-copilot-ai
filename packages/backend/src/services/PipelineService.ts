import { prisma } from '../utils/prisma';
import { AiServiceClient } from '../clients/AiServiceClient';
import { StorageProvider } from './StorageService';

export class PipelineService {
  constructor(
    private aiClient: AiServiceClient,
    private storageProvider: StorageProvider
  ) {}

  async processDocument(documentId: string, userId: string) {
    // 1. Get document details and update job status
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: { versions: { orderBy: { version: 'desc' }, take: 1 } },
    });

    if (!document || document.versions.length === 0) {
      throw new Error('Document or version not found');
    }

    const version = document.versions[0];

    // Create or update processing job
    const job = await prisma.processingJob.upsert({
      where: { documentId },
      update: { status: 'EXTRACTING', error: null, startedAt: new Date(), finishedAt: null },
      create: { documentId, status: 'EXTRACTING' },
    });

    await prisma.document.update({ where: { id: documentId }, data: { isProcessing: true } });

    try {
      // 2. Fetch physical file from storage
      const fileBuffer = await this.storageProvider.downloadFile(version.storageKey);

      // 3. Call AI Service for extraction and chunking
      await prisma.processingJob.update({ where: { id: job.id }, data: { status: 'CHUNKING' } });
      const extractionResult = await this.aiClient.extractAndChunk(
        fileBuffer,
        version.originalName,
        document.fileType
      );

      // 4. Save Content and Chunks
      await prisma.$transaction(async (tx) => {
        // Upsert Document Content
        await tx.documentContent.upsert({
          where: { documentId },
          update: {
            rawText: extractionResult.raw_text,
            cleanText: extractionResult.clean_text,
            wordCount: extractionResult.word_count,
          },
          create: {
            documentId,
            rawText: extractionResult.raw_text,
            cleanText: extractionResult.clean_text,
            wordCount: extractionResult.word_count,
          },
        });

        // Delete existing chunks if any, then insert new ones
        await tx.documentChunk.deleteMany({ where: { documentId } });
        
        if (extractionResult.chunks.length > 0) {
          await tx.documentChunk.createMany({
            data: extractionResult.chunks.map((chunk) => ({
              documentId,
              content: chunk.content,
              chunkIndex: chunk.chunk_index,
              metadata: chunk.metadata,
              charLength: chunk.char_length,
            })),
          });
        }

        // Complete Job
        await tx.processingJob.update({
          where: { id: job.id },
          data: { status: 'COMPLETED', finishedAt: new Date() },
        });

        await tx.document.update({ where: { id: documentId }, data: { isProcessing: false } });
        
        // Start VectorSync Job
        if (extractionResult.chunks.length > 0) {
          await tx.vectorSyncJob.upsert({
            where: { documentId },
            update: { status: 'PENDING', error: null, startedAt: new Date(), finishedAt: null },
            create: { documentId, status: 'PENDING' }
          });
        }
      });
      
      // Async trigger vectorization
      if (extractionResult.chunks.length > 0) {
        this.triggerVectorization(userId, documentId, extractionResult.chunks).catch(err => console.error(err));
      }

    } catch (error: any) {
      console.error(`Pipeline failed for document ${documentId}:`, error);
      await prisma.processingJob.update({
        where: { id: job.id },
        data: { status: 'FAILED', error: error.message || 'Unknown error', finishedAt: new Date() },
      });
      await prisma.document.update({ where: { id: documentId }, data: { isProcessing: false } });
      throw error;
    }
  }

  async getChunks(documentId: string) {
    return prisma.documentChunk.findMany({
      where: { documentId },
      orderBy: { chunkIndex: 'asc' },
    });
  }

  async getContent(documentId: string) {
    return prisma.documentContent.findUnique({
      where: { documentId },
    });
  }

  async getStatus(documentId: string) {
    return prisma.processingJob.findUnique({
      where: { documentId },
    });
  }

  private async triggerVectorization(userId: string, documentId: string, chunks: any[]) {
    try {
      await prisma.vectorSyncJob.update({
        where: { documentId },
        data: { status: 'EMBEDDING' }
      });

      await this.aiClient.vectorize(userId, documentId, chunks);

      await prisma.$transaction(async (tx) => {
        await tx.vectorSyncJob.update({
          where: { documentId },
          data: { status: 'COMPLETED', finishedAt: new Date() }
        });
        
        // Mark chunks as vectorized
        await tx.documentChunk.updateMany({
          where: { documentId },
          data: { isVectorized: true }
        });
      });
    } catch (error: any) {
      console.error(`Vectorization failed for document ${documentId}:`, error);
      await prisma.vectorSyncJob.update({
        where: { documentId },
        data: { status: 'FAILED', error: error.message || 'Unknown error', finishedAt: new Date() }
      });
    }
  }
}
