import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import { QueryService } from '../services/query';
import { UploadService } from '../services/upload';

const router = Router();
const queryService = new QueryService();
const uploadService = new UploadService();

// Configure multer for file uploads
const upload = multer({
  dest: path.join(__dirname, '../../uploads'),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

/**
 * POST /api/policy-query
 * Execute a policy query with structural retrieval
 */
router.post('/policy-query', async (req: Request, res: Response) => {
  try {
    const { query, limit } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        error: 'Query parameter is required and must be a string',
      });
    }

    const result = await queryService.query(query, limit || 5);

    res.json(result);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

/**
 * GET /api/stats
 * Get statistics about indexed data
 */
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = await queryService.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to get statistics',
    });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/upload
 * Upload and ingest a policy document
 */
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    // Validate file
    const validation = uploadService.validateFile(req.file);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
      });
    }

    // Get clearExisting flag from request
    const clearExisting = req.body.clearExisting === 'true';

    // Process the uploaded file
    const result = await uploadService.processUpload(req.file.path, clearExisting);

    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error) {
    console.error('Upload endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process upload',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
