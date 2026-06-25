import { prisma } from '../utils/prisma';
import { AiServiceClient } from '../clients/AiServiceClient';

export class SearchService {
  constructor(private aiClient: AiServiceClient) {}

  async search(userId: string, query: string, documentId?: string, topK: number = 5) {
    // 1. Log query
    const history = await prisma.searchHistory.create({
      data: {
        userId,
        query,
        results: [], // Will update later if needed
      },
    });

    // 2. Execute vector search via AI service
    const searchResponse = await this.aiClient.search(query, userId, documentId, topK);

    // 3. Format results for frontend
    const formattedResults = searchResponse.results.map((r: any) => ({
      documentId: r.payload.document_id,
      chunkId: r.payload.chunk_id,
      score: r.score,
      content: r.payload.content,
      source: {
        documentName: r.payload.metadata?.source || 'Unknown Document'
      }
    }));
    
    // We update the search history with the returned chunk IDs
    const chunkIds = formattedResults.map((r: any) => r.chunkId);
    await prisma.searchHistory.update({
      where: { id: history.id },
      data: { results: chunkIds },
    });

    return formattedResults;
  }

  async getHistory(userId: string) {
    return prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getMetrics(userId: string) {
    const totalDocuments = await prisma.document.count({ where: { userId } });
    const indexedVectors = await prisma.documentChunk.count({ where: { document: { userId }, isVectorized: true } });
    const searchCount = await prisma.searchHistory.count({ where: { userId } });

    return {
      totalDocuments,
      indexedVectors,
      searchCount,
    };
  }
}
