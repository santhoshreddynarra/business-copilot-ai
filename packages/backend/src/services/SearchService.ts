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

    // 3. Map Qdrant results back to full chunk text if we didn't store full payload in Qdrant
    // Since we DO store full payload (content, metadata) in Qdrant, we can just return it.
    
    // We update the search history with the returned chunk IDs
    const chunkIds = searchResponse.results.map((r: any) => r.payload.chunk_id);
    await prisma.searchHistory.update({
      where: { id: history.id },
      data: { results: chunkIds },
    });

    return searchResponse.results;
  }

  async getHistory(userId: string) {
    return prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
