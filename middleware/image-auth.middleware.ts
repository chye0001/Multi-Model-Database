import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/postgres/prisma-client.js';

/**
 * Middleware to check if user can DELETE an image.
 * Rules:
 * - Admin: can delete any image
 * - Owner: can delete if they have the image's parent item in at least one of their closets
 *   (Image → Item → ClosetItem → Closet → User)
 * - Anyone else: 403 Forbidden
 */
export const canDeleteImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const imageId = req.params.id;
    if (!imageId) {
      return res.status(400).send({ error: 'Image ID is required' });
    }

    if (!req.session.userId) {
      return res.status(401).send({ error: 'Unauthorized: Please log in' });
    }

    if (req.session.userRole === 'admin') {
      return next();
    }

    const parsedId = Number(imageId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).send({ error: 'Invalid image ID' });
    }

    const owned = await prisma.image.findFirst({
      where: {
        id: BigInt(parsedId),
        item: {
          closetItem: {
            some: {
              closet: {
                OR: [
                  { userId: req.session.userId },
                  { sharedCloset: { some: { userId: req.session.userId } } },
                ],
              },
            },
          },
        },
      },
    });

    if (!owned) {
      return res.status(403).send({ error: 'Forbidden: You do not own this image' });
    }

    next();
  } catch (error) {
    console.error('Error in canDeleteImage middleware:', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
};
