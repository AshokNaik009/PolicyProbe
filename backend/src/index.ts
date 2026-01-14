import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import policyRoutes from './routes/policy';

// Load environment variables from root directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app: Application = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api', policyRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PolicyProbe V2 API',
    version: '1.0.0',
    description: 'High-Fidelity Structural Knowledge Retrieval',
    endpoints: {
      health: 'GET /api/health',
      stats: 'GET /api/stats',
      query: 'POST /api/policy-query',
    },
  });
});

// Error handling
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n🚀 PolicyProbe V2 Backend Server');
  console.log('================================');
  console.log(`Server running on: http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Stats: http://localhost:${PORT}/api/stats`);
  console.log('\nReady to process queries! 🎯\n');
});

export default app;
