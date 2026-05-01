import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/postgres/prisma-client.js';

/**
 * Middleware to check if user can MODIFY an outfit (delete outfit, remove items).
 * Rules:
 * - Admin: can modify any outfit
 * - Creator: can modify their own outfit (outfit.createdBy === session userId)
 * - Anyone else: 403 Forbidden
 */
export const canModifyOutfit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const outfitId = req.params.id;
    if (!outfitId) {
      return res.status(400).send({ error: 'Outfit ID is required' });
    }

    if (!req.session.userId) {
      return res.status(401).send({ error: 'Unauthorized: Please log in' });
    }

    if (req.session.userRole === 'admin') {
      return next();
    }

    const parsedId = Number(outfitId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).send({ error: 'Invalid outfit ID' });
    }

    const outfit = await prisma.outfit.findFirst({
      where: {
        id: BigInt(parsedId),
        createdBy: req.session.userId,
      },
    });

    if (!outfit) {
      return res.status(403).send({ error: 'Forbidden: You do not own this outfit' });
    }

    next();
  } catch (error) {
    console.error('Error in canModifyOutfit middleware:', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
};
