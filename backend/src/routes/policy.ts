import { Router, Request, Response } from 'express';
import { QueryService } from '../services/query';

const router = Router();
const queryService = new QueryService();

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

export default router;
