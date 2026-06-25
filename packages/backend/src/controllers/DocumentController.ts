import { Request, Response, NextFunction } from 'express';
import { DocumentService } from '../services/DocumentService';
import { LocalStorageService } from '../services/LocalStorageService';
import { PipelineService } from '../services/PipelineService';
import { AiServiceClient } from '../clients/AiServiceClient';

// Initialize services
const storageProvider = new LocalStorageService();
const documentService = new DocumentService(storageProvider);
const aiClient = new AiServiceClient();
const pipelineService = new PipelineService(aiClient, storageProvider);

export class DocumentController {
  
  static async uploadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const file = req.file;
      const { title, description } = req.body;
      const userId = req.user!.id;

      if (!file) {
        return res.status(400).json({ error: { code: 400, message: 'No file uploaded' } });
      }

      const document = await documentService.uploadDocument(
        userId,
        file.buffer,
        file.originalname,
        file.mimetype,
        file.size,
        title,
        description
      );

      res.status(201).json({ data: document });
    } catch (error) {
      next(error);
    }
  }

  static async listDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const documents = await documentService.listDocuments(userId);
      res.status(200).json({ data: documents });
    } catch (error) {
      next(error);
    }
  }

  static async getDocumentDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const userId = req.user!.id;
      
      const document = await documentService.getDocumentDetails(userId, id as string);
      res.status(200).json({ data: document });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: { code: 404, message: error.message } });
      }
      next(error);
    }
  }

  static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const userId = req.user!.id;

      await documentService.deleteDocument(userId, id as string);
      res.status(200).json({ data: { success: true } });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: { code: 404, message: error.message } });
      }
      next(error);
    }
  }

  static async downloadDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const userId = req.user!.id;

      const { buffer, originalName, mimetype } = await documentService.getDownloadBuffer(userId, id as string);

      res.setHeader('Content-Disposition', `attachment; filename="${originalName}"`);
      res.setHeader('Content-Type', mimetype);
      res.send(buffer);
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: { code: 404, message: error.message } });
      }
      next(error);
    }
  }

  static async processDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const userId = req.user!.id;

      // Verify access first
      await documentService.getDocumentDetails(userId, id);
      
      // Start processing in background
      pipelineService.processDocument(id, userId).catch(err => console.error(err));

      res.status(202).json({ data: { message: 'Processing started' } });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return res.status(404).json({ error: { code: 404, message: error.message } });
      }
      next(error);
    }
  }

  static async getProcessingStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const userId = req.user!.id;
      await documentService.getDocumentDetails(userId, id);

      const status = await pipelineService.getStatus(id);
      res.status(200).json({ data: status });
    } catch (error) {
      next(error);
    }
  }

  static async getDocumentChunks(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const userId = req.user!.id;
      await documentService.getDocumentDetails(userId, id);

      const chunks = await pipelineService.getChunks(id);
      res.status(200).json({ data: chunks });
    } catch (error) {
      next(error);
    }
  }

  static async getDocumentContent(req: Request, res: Response, next: NextFunction) {
    try {
      const id = String(req.params.id);
      const userId = req.user!.id;
      await documentService.getDocumentDetails(userId, id);

      const content = await pipelineService.getContent(id);
      res.status(200).json({ data: content });
    } catch (error) {
      next(error);
    }
  }
}
