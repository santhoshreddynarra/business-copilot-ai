import { Router, Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import axios from 'axios';

const router = Router();

const startTime = Date.now();

/**
 * GET /api/system/health
 * Returns detailed health status of all platform services.
 * Useful for monitoring dashboards and uptime checks.
 */
router.get('/health', async (req: Request, res: Response) => {
  const checks = await Promise.allSettled([
    checkDatabase(),
    checkAiService(),
    checkQdrant(),
    checkProcessorStatus(),
  ]);

  const [dbResult, aiResult, qdrantResult, processorResult] = checks;

  const database = dbResult.status === 'fulfilled' ? dbResult.value : { status: 'Offline', latencyMs: -1 };
  const aiService = aiResult.status === 'fulfilled' ? aiResult.value : { status: 'Offline', latencyMs: -1 };
  const vectorDb = qdrantResult.status === 'fulfilled' ? qdrantResult.value : { status: 'Offline', latencyMs: -1 };
  const processor = processorResult.status === 'fulfilled' ? processorResult.value : { status: 'Unknown', activeJobs: 0 };

  const allHealthy = database.status === 'Online' && aiService.status === 'Online';
  const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

  res.status(allHealthy ? 200 : 503).json({
    data: {
      overall: allHealthy ? 'Healthy' : 'Degraded',
      uptimeSeconds,
      timestamp: new Date().toISOString(),
      services: {
        backend: { status: 'Online', version: process.env.npm_package_version || '1.0.0' },
        database,
        aiService,
        vectorDb,
        documentProcessor: processor,
      },
    },
  });
});

/**
 * GET /api/system/status
 * Lightweight liveness probe — returns 200 if the process is up.
 */
router.get('/status', (req: Request, res: Response) => {
  res.json({
    data: {
      status: 'ok',
      uptime: process.uptime(),
      memoryMB: Math.round(process.memoryUsage().rss / 1024 / 1024),
      nodeVersion: process.version,
    },
  });
});

/**
 * GET /api/system/metrics
 * Returns aggregated platform usage statistics from the database.
 * Used by the dashboard to display real-time counts and trends.
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    const [userCount, documentCount, searchCount, jobCount] = await Promise.all([
      prisma.user.count(),
      prisma.document.count(),
      prisma.searchHistory.count(),
      prisma.processingJob.count({ where: { status: { in: ['EXTRACTING', 'CHUNKING'] } } }),
    ]);

    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);
    const memoryMB = Math.round(process.memoryUsage().rss / 1024 / 1024);

    res.json({
      data: {
        users: userCount,
        documents: documentCount,
        searches: searchCount,
        activeJobs: jobCount,
        uptimeSeconds,
        memoryMB,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    res.status(500).json({ error: { code: 500, message: 'Failed to fetch metrics' } });
  }
});

/**
 * GET /api/system/activity
 * Returns the 10 most recent platform events (uploads + searches) for the
 * live activity feed on the dashboard.
 */
router.get('/activity', async (req: Request, res: Response) => {
  try {
    const [recentDocs, recentSearches] = await Promise.all([
      prisma.document.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, status: true, createdAt: true },
      }),
      prisma.searchHistory.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, query: true, createdAt: true },
      }),
    ]);

    const events = [
      ...recentDocs.map((d) => ({
        id: `doc-${d.id}`,
        type: 'upload' as const,
        label: d.name,
        status: d.status,
        timestamp: d.createdAt,
      })),
      ...recentSearches.map((s) => ({
        id: `search-${s.id}`,
        type: 'search' as const,
        label: s.query,
        status: 'COMPLETED',
        timestamp: s.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10);

    res.json({ data: events });
  } catch (err) {
    res.status(500).json({ error: { code: 500, message: 'Failed to fetch activity' } });
  }
});

// ── Helpers ────────────────────────────────────────────────────────────────

async function checkDatabase(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  await prisma.$queryRaw`SELECT 1`;
  return { status: 'Online', latencyMs: Date.now() - start };
}

async function checkAiService(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  const aiHost = process.env.AI_SERVICE_URL
    ? new URL(process.env.AI_SERVICE_URL).origin
    : 'http://localhost:8000';
  const response = await axios.get(`${aiHost}/api/vector/health`, { timeout: 3000 });
  const ok = response.data?.status === 'ok';
  return { status: ok ? 'Online' : 'Degraded', latencyMs: Date.now() - start };
}

async function checkQdrant(): Promise<{ status: string; latencyMs: number }> {
  const start = Date.now();
  const qdrantUrl = process.env.QDRANT_URL || 'http://localhost:6333';
  await axios.get(`${qdrantUrl}/healthz`, { timeout: 3000 });
  return { status: 'Online', latencyMs: Date.now() - start };
}

async function checkProcessorStatus(): Promise<{ status: string; activeJobs: number }> {
  const activeJobs = await prisma.processingJob.count({
    where: { status: { in: ['EXTRACTING', 'CHUNKING'] } },
  });
  return {
    status: activeJobs > 0 ? 'Processing' : 'Idle',
    activeJobs,
  };
}

export default router;
