import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/SearchService';
import { AiServiceClient } from '../clients/AiServiceClient';

const aiClient = new AiServiceClient();
const searchService = new SearchService(aiClient);

export class SearchController {
  static async searchAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { query, topK } = req.body;
      const userId = (req as any).user?.id || 'mock-user-id';

      if (!query) {
        return res.status(400).json({ error: { code: 400, message: 'Query is required' } });
      }

      const results = await searchService.search(userId, query, undefined, topK);
      res.status(200).json({ data: results });
    } catch (error) {
      next(error);
    }
  }

  static async searchDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { query, topK } = req.body;
      const userId = (req as any).user?.id || 'mock-user-id';

      if (!query) {
        return res.status(400).json({ error: { code: 400, message: 'Query is required' } });
      }

      const results = await searchService.search(userId, query, id, topK);
      res.status(200).json({ data: results });
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user?.id || 'mock-user-id';
      const history = await searchService.getHistory(userId);
      res.status(200).json({ data: history });
    } catch (error) {
      next(error);
    }
  }
}
