import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../database/postgres/prisma-client.js';

/**
 * Middleware to check if user can MODIFY a review (edit or delete).
 * Rules:
 * - Admin: can modify any review
 * - Author: can modify their own review (review.writtenBy === session userId)
 * - Anyone else: 403 Forbidden
 */
export const canModifyReview = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reviewId = req.params.id;
    if (!reviewId) {
      return res.status(400).send({ error: 'Review ID is required' });
    }

    if (!req.session.userId) {
      return res.status(401).send({ error: 'Unauthorized: Please log in' });
    }

    if (req.session.userRole === 'admin') {
      return next();
    }

    const parsedId = Number(reviewId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).send({ error: 'Invalid review ID' });
    }

    const review = await prisma.review.findFirst({
      where: {
        id: BigInt(parsedId),
        writtenBy: req.session.userId,
      },
    });

    if (!review) {
      return res.status(403).send({ error: 'Forbidden: You did not write this review' });
    }

    next();
  } catch (error) {
    console.error('Error in canModifyReview middleware:', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
};
