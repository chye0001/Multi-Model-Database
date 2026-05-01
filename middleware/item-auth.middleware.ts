import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/postgres/prisma-client.js';

/**
 * Middleware to check if user can MODIFY an item (update, delete, manage images/brands).
 * Rules:
 * - Admin: can modify any item
 * - Owner: can modify if the item is in at least one of their owned closets
 * - Shared user: can modify if the item is in a closet shared with them
 *   (Item → ClosetItem → Closet → owner OR shared user)
 * - Anyone else: 403 Forbidden
 */
export const canModifyItem = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const itemId = req.params.id;
    if (!itemId) {
      return res.status(400).send({ error: 'Item ID is required' });
    }

    if (!req.session.userId) {
      return res.status(401).send({ error: 'Unauthorized: Please log in' });
    }

    if (req.session.userRole === 'admin') {
      return next();
    }

    const parsedId = Number(itemId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).send({ error: 'Invalid item ID' });
    }

    const hasAccess = await prisma.closetItem.findFirst({
      where: {
        itemId: BigInt(parsedId),
        closet: {
          OR: [
            { userId: req.session.userId },
            { sharedCloset: { some: { userId: req.session.userId } } },
          ],
        },
      },
    });

    if (!hasAccess) {
      return res.status(403).send({ error: 'Forbidden: You do not have access to this item' });
    }

    next();
  } catch (error) {
    console.error('Error in canModifyItem middleware:', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
};
