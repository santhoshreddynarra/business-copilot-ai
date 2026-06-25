import { describe, it, expect, jest, beforeEach } from '@jest/globals';

/**
 * Unit tests for SearchService
 * Mocks Prisma and AiServiceClient — no real DB or network calls.
 */

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockPrisma = {
  searchHistory: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  document: {
    count: jest.fn(),
  },
  documentChunk: {
    count: jest.fn(),
  },
};

jest.mock('../utils/prisma', () => ({ prisma: mockPrisma }));

const mockAiClient = {
  search: jest.fn(),
};

import { SearchService } from '../services/SearchService';

const searchService = new SearchService(mockAiClient as any);

describe('SearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── search ────────────────────────────────────────────────────────────────
  describe('search()', () => {
    it('should log query to search history before search', async () => {
      mockPrisma.searchHistory.create.mockResolvedValue({ id: 'hist-1', query: 'test query' } as any);
      mockAiClient.search.mockResolvedValue({ results: [] } as any);
      mockPrisma.searchHistory.update.mockResolvedValue({} as any);

      await searchService.search('user-1', 'test query');

      expect(mockPrisma.searchHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1', query: 'test query' }),
        })
      );
    });

    it('should call AI service with correct params', async () => {
      mockPrisma.searchHistory.create.mockResolvedValue({ id: 'hist-1' } as any);
      mockAiClient.search.mockResolvedValue({ results: [] } as any);
      mockPrisma.searchHistory.update.mockResolvedValue({} as any);

      await searchService.search('user-1', 'quarterly revenue', 'doc-123', 15);

      expect(mockAiClient.search).toHaveBeenCalledWith('quarterly revenue', 'user-1', 'doc-123', 15);
    });

    it('should format AI results correctly', async () => {
      mockPrisma.searchHistory.create.mockResolvedValue({ id: 'hist-1' } as any);
      mockAiClient.search.mockResolvedValue({
        results: [
          {
            score: 0.92,
            payload: {
              document_id: 'doc-1',
              chunk_id: 'chunk-1',
              content: 'Revenue grew by 25% in Q1.',
              metadata: { source: 'Q1 Report.pdf' },
            },
          },
        ],
      } as any);
      mockPrisma.searchHistory.update.mockResolvedValue({} as any);

      const results = await searchService.search('user-1', 'revenue');

      expect(results).toHaveLength(1);
      expect(results[0]).toMatchObject({
        documentId: 'doc-1',
        chunkId: 'chunk-1',
        score: 0.92,
        content: 'Revenue grew by 25% in Q1.',
        source: { documentName: 'Q1 Report.pdf' },
      });
    });

    it('should update history with returned chunk IDs', async () => {
      const histId = 'hist-2';
      mockPrisma.searchHistory.create.mockResolvedValue({ id: histId } as any);
      mockAiClient.search.mockResolvedValue({
        results: [
          { score: 0.9, payload: { document_id: 'd1', chunk_id: 'c1', content: 'text', metadata: {} } },
          { score: 0.8, payload: { document_id: 'd1', chunk_id: 'c2', content: 'text2', metadata: {} } },
        ],
      } as any);
      mockPrisma.searchHistory.update.mockResolvedValue({} as any);

      await searchService.search('user-1', 'query');

      expect(mockPrisma.searchHistory.update).toHaveBeenCalledWith({
        where: { id: histId },
        data: { results: ['c1', 'c2'] },
      });
    });

    it('should return empty array when no results found', async () => {
      mockPrisma.searchHistory.create.mockResolvedValue({ id: 'hist-3' } as any);
      mockAiClient.search.mockResolvedValue({ results: [] } as any);
      mockPrisma.searchHistory.update.mockResolvedValue({} as any);

      const results = await searchService.search('user-1', 'no match query');
      expect(results).toEqual([]);
    });
  });

  // ── getHistory ────────────────────────────────────────────────────────────
  describe('getHistory()', () => {
    it('should return search history for user ordered by latest', async () => {
      const mockHistory = [
        { id: 'h1', query: 'revenue', createdAt: new Date() },
        { id: 'h2', query: 'growth', createdAt: new Date() },
      ];
      mockPrisma.searchHistory.findMany.mockResolvedValue(mockHistory as any);

      const history = await searchService.getHistory('user-1');

      expect(mockPrisma.searchHistory.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          orderBy: { createdAt: 'desc' },
          take: 50,
        })
      );
      expect(history).toHaveLength(2);
    });
  });

  // ── getMetrics ────────────────────────────────────────────────────────────
  describe('getMetrics()', () => {
    it('should return aggregated metrics for user', async () => {
      mockPrisma.document.count.mockResolvedValue(12 as any);
      mockPrisma.documentChunk.count.mockResolvedValue(340 as any);
      mockPrisma.searchHistory.count.mockResolvedValue(87 as any);

      const metrics = await searchService.getMetrics('user-1');

      expect(metrics).toEqual({
        totalDocuments: 12,
        indexedVectors: 340,
        searchCount: 87,
      });
    });
  });
});
