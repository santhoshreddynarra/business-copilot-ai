import { Router } from 'express';
import { prisma } from '../utils/prisma';
import axios from 'axios';

const router = Router();

router.get('/health', async (req, res) => {
  let dbStatus = 'Offline';
  let aiStatus = 'Offline';
  const backendStatus = 'Online';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'Online';
  } catch (e) {
    dbStatus = 'Offline';
  }

  try {
    // Assuming AI service runs on localhost:8000 natively or ai-service:8000 in docker
    const aiHost = process.env.AI_SERVICE_URL ? new URL(process.env.AI_SERVICE_URL).origin : 'http://localhost:8000';
    const response = await axios.get(`${aiHost}/api/vector/health`, { timeout: 2000 });
    if (response.data.status === 'ok') {
      aiStatus = 'Online';
    }
  } catch (e) {
    aiStatus = 'Offline';
  }

  // Check if any jobs are currently processing
  let processorStatus = 'Idle';
  try {
    const activeJobs = await prisma.processingJob.count({
      where: { status: { in: ['EXTRACTING', 'CHUNKING'] } }
    });
    if (activeJobs > 0) processorStatus = 'Processing';
  } catch (e) {
    // Ignore db errors for processor status
  }

  res.json({
    data: {
      backend: backendStatus,
      database: dbStatus,
      aiService: aiStatus,
      documentProcessor: processorStatus
    }
  });
});

export default router;
