import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

/**
 * Validates that a resourceId in the URL actually belongs to the logged-in clinic.
 * Prevents doctors from accessing other clinics' data by guessing IDs.
 *
 * Usage: router.get('/:id', authMiddleware, tenantGuard('appointment'), handler)
 */
export function tenantGuard(resource: 'appointment' | 'patient' | 'message' | 'staff') {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const resourceId = req.params.id;
    const clinicId = req.clinicId;

    if (!resourceId || !clinicId) {
      next();
      return;
    }

    try {
      let record: { clinicId: string } | null = null;

      if (resource === 'appointment') {
        record = await prisma.appointment.findUnique({
          where: { id: resourceId },
          select: { clinicId: true },
        });
      } else if (resource === 'patient') {
        record = await prisma.patient.findUnique({
          where: { id: resourceId },
          select: { clinicId: true },
        });
      } else if (resource === 'message') {
        record = await prisma.message.findUnique({
          where: { id: resourceId },
          select: { clinicId: true },
        });
      } else if (resource === 'staff') {
        record = await prisma.staffMember.findUnique({
          where: { id: resourceId },
          select: { clinicId: true },
        });
      }

      if (!record) {
        res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
        return;
      }

      if (record.clinicId !== clinicId) {
        // Do NOT reveal that the resource exists — return 404 to prevent enumeration
        res.status(404).json({ error: 'Resource not found', code: 'NOT_FOUND' });
        return;
      }

      next();
    } catch {
      res.status(500).json({ error: 'Authorization check failed', code: 'SERVER_ERROR' });
    }
  };
}
