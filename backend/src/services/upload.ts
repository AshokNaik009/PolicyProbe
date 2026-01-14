import * as fs from 'fs';
import { PDFExtract } from 'pdf.js-extract';
import { StructuralChunker } from './chunking';
import { IngestionService } from './ingestion';
import { getWeaviateClient, POLICY_SEGMENT_CLASS, getPolicySegmentSchema } from '../config/weaviate';

export interface UploadProgress {
  stage: 'parsing' | 'chunking' | 'ingesting' | 'complete' | 'error';
  message: string;
  progress?: number;
  totalChunks?: number;
  error?: string;
}

export class UploadService {
  private chunker = new StructuralChunker();
  private ingestionService = new IngestionService();

  /**
   * Extract text from PDF file
   */
  private async extractPdfText(filePath: string): Promise<string> {
    try {
      const pdfExtract = new PDFExtract();
      const options = {}; // Default options work well
      const data = await pdfExtract.extract(filePath, options);

      // Extract text from all pages
      let fullText = '';
      for (const page of data.pages) {
        // Extract text from each item on the page
        const pageText = page.content
          .map((item: any) => item.str)
          .join(' ');
        fullText += pageText + '\n\n';
      }

      return fullText.trim();
    } catch (error) {
      console.error('PDF parsing error:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  /**
   * Read file content based on file type
   */
  private async readFileContent(filePath: string, originalName: string): Promise<string> {
    const isPdf = originalName.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      console.log('   Extracting text from PDF...');
      return await this.extractPdfText(filePath);
    } else {
      // Plain text or markdown
      return fs.readFileSync(filePath, 'utf-8');
    }
  }

  /**
   * Process uploaded file and ingest to Weaviate
   */
  async processUpload(filePath: string, originalName: string, clearExisting: boolean = false): Promise<{
    success: boolean;
    totalChunks: number;
    message: string;
    error?: string;
  }> {
    try {
      console.log(`📄 Processing uploaded file: ${filePath}`);

      // Ensure schema exists
      const client = getWeaviateClient();
      const schema = await client.schema.getter().do();
      const classExists = schema.classes?.some((c: any) => c.class === POLICY_SEGMENT_CLASS);

      if (!classExists) {
        console.log('   Creating schema...');
        await client.schema.classCreator().withClass(getPolicySegmentSchema()).do();
      }

      // Clear existing data if requested
      if (clearExisting) {
        console.log('🗑️  Clearing existing data...');
        try {
          await client.schema.classDeleter().withClassName(POLICY_SEGMENT_CLASS).do();
          await client.schema.classCreator().withClass(getPolicySegmentSchema()).do();
          console.log('   ✓ Data cleared');
        } catch (err) {
          console.log('   No existing data to clear');
        }
      }

      // Read file content (handles both text and PDF)
      const content = await this.readFileContent(filePath, originalName);
      console.log(`   Extracted text size: ${(content.length / 1024).toFixed(2)} KB`);

      // Chunk the document
      console.log('✂️  Chunking document...');
      const chunks = this.chunker.chunkDocument(content);
      console.log(`   Created ${chunks.length} chunks`);

      // Ingest chunks
      console.log('📤 Ingesting to Weaviate...');
      await this.ingestionService.ingestChunks(chunks);

      // Verify
      const count = await this.ingestionService.getCount();
      console.log(`✅ Upload complete! Total chunks: ${count}`);

      // Clean up uploaded file
      fs.unlinkSync(filePath);

      return {
        success: true,
        totalChunks: chunks.length,
        message: `Successfully ingested ${chunks.length} chunks from document`,
      };
    } catch (error) {
      console.error('Upload processing error:', error);

      // Clean up file on error
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      return {
        success: false,
        totalChunks: 0,
        message: 'Failed to process document',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Validate uploaded file
   */
  validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        valid: false,
        error: 'File size exceeds 10MB limit',
      };
    }

    // Check file type
    const allowedMimeTypes = [
      'text/plain',
      'text/markdown',
      'application/pdf',
      'application/octet-stream'
    ];
    const allowedExtensions = ['.txt', '.md', '.markdown', '.pdf'];

    const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);
    const hasValidExtension = allowedExtensions.some(ext =>
      file.originalname.toLowerCase().endsWith(ext)
    );

    if (!hasValidMimeType && !hasValidExtension) {
      return {
        valid: false,
        error: 'Invalid file type. Only .txt, .md, and .pdf files are supported',
      };
    }

    return { valid: true };
  }
}
