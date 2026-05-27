import { Router, Response } from 'express';
import prisma from '../lib/prisma';

const router = Router();

router.get('/info', async (_req, res: Response) => {
  try {
    const configs = await prisma.eventConfig.findMany({
      where: {
        key: { in: ['event_name', 'event_description', 'start_time', 'end_time', 'is_running'] },
      },
    });

    const configMap = new Map(configs.map((c) => [c.key, c.value]));

    const eventInfo = {
      name: configMap.get('event_name') || 'CTF Event',
      description: configMap.get('event_description') || '',
      startTime: configMap.get('start_time') || null,
      endTime: configMap.get('end_time') || null,
      isRunning: configMap.get('is_running') === true,
    };

    res.json({ success: true, data: eventInfo });
  } catch (error) {
    console.error('Event info error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
