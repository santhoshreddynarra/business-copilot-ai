import axios from 'axios';
import FormData from 'form-data';

export interface ChunkResponse {
  content: string;
  chunk_index: number;
  metadata: any;
  char_length: number;
}

export interface ExtractionResponse {
  raw_text: string;
  clean_text: string;
  word_count: number;
  chunks: ChunkResponse[];
}

export class AiServiceClient {
  private baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000/api/v1';

  async extractAndChunk(fileBuffer: Buffer, filename: string, mimetype: string): Promise<ExtractionResponse> {
    const formData = new FormData();
    formData.append('file', fileBuffer, {
      filename,
      contentType: mimetype,
    });

    const response = await axios.post<ExtractionResponse>(
      `${this.baseUrl}/extract-and-chunk`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
        },
      }
    );

    return response.data;
  }
}
