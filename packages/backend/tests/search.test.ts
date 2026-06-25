import { SearchService } from '../src/services/SearchService';
import { AiServiceClient } from '../src/clients/AiServiceClient';

// Mock prisma and AI Client
jest.mock('../src/utils/prisma', () => ({
  prisma: {
    searchHistory: {
      create: jest.fn().mockResolvedValue({ id: 'history-123' }),
      update: jest.fn().mockResolvedValue({}),
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(10)
    },
    document: {
      count: jest.fn().mockResolvedValue(5)
    },
    documentChunk: {
      count: jest.fn().mockResolvedValue(100)
    }
  }
}));

jest.mock('../src/clients/AiServiceClient');

describe('SearchService Integration', () => {
  let searchService: SearchService;
  let aiClientMock: jest.Mocked<AiServiceClient>;

  beforeEach(() => {
    aiClientMock = new AiServiceClient() as jest.Mocked<AiServiceClient>;
    searchService = new SearchService(aiClientMock);
  });

  it('should call ai client and map results correctly', async () => {
    aiClientMock.search.mockResolvedValue({
      results: [
        {
          score: 0.95,
          payload: {
            document_id: 'doc-123',
            chunk_id: 'chunk-456',
            content: 'Test content',
            metadata: { source: 'test.pdf' }
          }
        }
      ]
    });

    const results = await searchService.search('user-1', 'test query');

    expect(aiClientMock.search).toHaveBeenCalledWith('test query', 'user-1', undefined, 5);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      documentId: 'doc-123',
      chunkId: 'chunk-456',
      score: 0.95,
      content: 'Test content',
      source: {
        documentName: 'test.pdf'
      }
    });
  });

  it('should fetch metrics correctly', async () => {
    const metrics = await searchService.getMetrics('user-1');
    expect(metrics.totalDocuments).toBe(5);
    expect(metrics.indexedVectors).toBe(100);
    expect(metrics.searchCount).toBe(10);
  });
});
