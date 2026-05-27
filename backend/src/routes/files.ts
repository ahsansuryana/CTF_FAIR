import { Router, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { getFileBuffer } from '../services/fileService';
import { AuthenticatedRequest } from '../types';

const router = Router();

router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { buffer, filename, mimeType } = await getFileBuffer(req.params.id!);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Length', buffer.length);
    res.send(buffer);
  } catch (error: any) {
    if (error.message === 'File not found') {
      res.status(404).json({ success: false, error: 'File not found' });
    } else {
      console.error('File download error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
});

export default router;
