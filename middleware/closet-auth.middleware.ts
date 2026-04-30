import type { Request, Response, NextFunction } from 'express';
import { closetRepositoryFactory } from '../repositories/factories/ClosetRepositoryFactory.js';
import type { Closet } from '../dtos/closets/Closet.dto.js';

/**
 * Helper function to check if a user can view a specific closet
 * Returns true/false without sending responses (reusable for single and array checks)
 */
export const userCanViewCloset = async (
  closet: Closet,
  userId: string | undefined,
  userRole: string | undefined
): Promise<boolean> => {
  // Admin can view any closet
  if (userRole === 'admin') {
    return true;
  }

  // Anyone can view public closets
  if (closet.isPublic) {
    return true;
  }

  // Private closet: must be authenticated, owner, or shared with user
  if (!userId) {
    return false;
  }

  // Owner can view their own closet
  if (closet.userId === userId) {
    return true;
  }

  // Check if closet is shared with user
  try {
    const closetRepository = closetRepositoryFactory();
    const shares = await closetRepository.getClosetShares(closet.id?.toString() || '');
    const isSharedWithUser = shares.some((share) => share.id === userId);
    return isSharedWithUser;
  } catch {
    return false;
  }
};

/**
 * Middleware to check if user can VIEW a single closet
 * Rules:
 * - Admin: can view any closet
 * - Owner: can view their own closet
 * - Public closet: anyone can view
 * - Shared closet: only shared users can view
 */
export const canViewCloset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const closetId = req.params.id as string;
    if (!closetId) {
      return res.status(400).send({ error: 'Closet ID is required' });
    }

    const closetRepository = closetRepositoryFactory();
    const closets = await closetRepository.getClosetById(closetId);

    if (closets.length === 0) {
      return res.status(404).send({ error: 'Closet not found' });
    }

    const closet = closets[0]!;

    const canView = await userCanViewCloset(closet, req.session.userId, req.session.userRole);

    if (!canView) {
      if (!req.session.userId) {
        return res.status(401).send({ error: 'Unauthorized: Please log in to access this closet' });
      }
      return res.status(403).send({ error: 'Forbidden: You do not have access to this closet' });
    }

    next();
  } catch (error) {
    console.error('Error in canViewCloset middleware:', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
};

/**
 * Middleware to filter an array of closets based on user permissions
 * Used with endpoints that return multiple closets (e.g., GET /closets)
 * Attaches filtered closets to req.user.viewableClosets
 */
export const filterViewableClosets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Store original send function
    const originalSend = res.send.bind(res);

    // Override send to filter closets before sending
    res.send = function(data: any) {
      if (Array.isArray(data)) {
        filterClosetArraySync(data, req.session.userId, req.session.userRole)
          .then((filtered) => {
            return originalSend.call(this, filtered);
          })
          .catch((error) => {
            console.error('Error filtering closets:', error);
            return originalSend.call(this, data); // Send unfiltered on error
          });
      } else {
        return originalSend.call(this, data);
      }
      return this;
    };

    next();
  } catch (error) {
    console.error('Error in filterViewableClosets middleware:', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
};

/**
 * Helper function to filter an array of closets based on permissions
 */
export const filterClosetArraySync = async (
  closets: Closet[],
  userId: string | undefined,
  userRole: string | undefined
): Promise<Closet[]> => {
  const viewable: Closet[] = [];

  for (const closet of closets) {
    const canView = await userCanViewCloset(closet, userId, userRole);
    if (canView) {
      viewable.push(closet);
    }
  }

  return viewable;
};

/**
 * Middleware to check if user can MODIFY closet items (add/remove)
 * Rules:
 * - Admin: can modify any closet's items
 * - Owner: can modify their own closet's items
 * - Shared user: can modify shared closet's items (but cannot delete the closet or change privacy)
 */
export const canModifyClosetItems = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const closetId = req.params.id as string;
    if (!closetId) {
      return res.status(400).send({ error: 'Closet ID is required' });
    }

    if (!req.session.userId) {
      return res.status(401).send({ error: 'Unauthorized: Please log in' });
    }

    const closetRepository = closetRepositoryFactory();
    const closets = await closetRepository.getClosetById(closetId);

    if (closets.length === 0) {
      return res.status(404).send({ error: 'Closet not found' });
    }

    const closet = closets[0]!;

    // Admin can modify any closet's items
    if (req.session.userRole === 'admin') {
      return next();
    }

    // Owner can modify their closet's items
    if (closet.userId === req.session.userId) {
      return next();
    }

    // Check if closet is shared with user
    const shares = await closetRepository.getClosetShares(closetId);
    const isSharedWithUser = shares.some((share) => share.id === req.session.userId);

    if (isSharedWithUser) {
      return next();
    }

    return res.status(403).send({ error: 'Forbidden: You do not have access to modify this closet' });
  } catch (error) {
    console.error('Error in canModifyClosetItems middleware:', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user can DELETE a closet
 * Rules:
 * - Admin: can delete any closet
 * - Owner: can delete their own closet
 * - Shared user: CANNOT delete (owner only)
 */
export const canDeleteCloset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const closetId = req.params.id as string;
    if (!closetId) {
      return res.status(400).send({ error: 'Closet ID is required' });
    }

    if (!req.session.userId) {
      return res.status(401).send({ error: 'Unauthorized: Please log in' });
    }

    const closetRepository = closetRepositoryFactory();
    const closets = await closetRepository.getClosetById(closetId);

    if (closets.length === 0) {
      return res.status(404).send({ error: 'Closet not found' });
    }

    const closet = closets[0]!;

    // Admin can delete any closet
    if (req.session.userRole === 'admin') {
      return next();
    }

    // Only owner (or admin) can delete a closet
    if (closet.userId !== req.session.userId) {
      return res.status(403).send({ error: 'Forbidden: Only the closet owner can delete it' });
    }

    next();
  } catch (error) {
    console.error('Error in canDeleteCloset middleware:', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user can UPDATE closet settings (name, description, isPublic)
 * Rules:
 * - Admin: can update any closet
 * - Owner: can update their own closet
 * - Shared user: CANNOT update closet settings (owner only)
 */
export const canUpdateClosetSettings = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const closetId = req.params.id as string;
    if (!closetId) {
      return res.status(400).send({ error: 'Closet ID is required' });
    }

    if (!req.session.userId) {
      return res.status(401).send({ error: 'Unauthorized: Please log in' });
    }

    const closetRepository = closetRepositoryFactory();
    const closets = await closetRepository.getClosetById(closetId);

    if (closets.length === 0) {
      return res.status(404).send({ error: 'Closet not found' });
    }

    const closet = closets[0]!;

    // Admin can update any closet
    if (req.session.userRole === 'admin') {
      return next();
    }

    // Only owner (or admin) can update closet settings
    if (closet.userId !== req.session.userId) {
      return res.status(403).send({ error: 'Forbidden: Only the closet owner can update closet settings' });
    }

    next();
  } catch (error) {
    console.error('Error in canUpdateClosetSettings middleware:', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
};

/**
 * Middleware to check if user can MANAGE a closet (share/unshare)
 * Rules:
 * - Admin: can manage any closet
 * - Owner: can manage their own closet
 * - Shared user: CANNOT manage (owner only)
 */
export const canManageCloset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const closetId = req.params.id as string;
    if (!closetId) {
      return res.status(400).send({ error: 'Closet ID is required' });
    }

    if (!req.session.userId) {
      return res.status(401).send({ error: 'Unauthorized: Please log in' });
    }

    const closetRepository = closetRepositoryFactory();
    const closets = await closetRepository.getClosetById(closetId);

    if (closets.length === 0) {
      return res.status(404).send({ error: 'Closet not found' });
    }

    const closet = closets[0]!;

    // Admin can manage any closet
    if (req.session.userRole === 'admin') {
      return next();
    }

    // Only owner (or admin) can manage a closet
    if (closet.userId !== req.session.userId) {
      return res.status(403).send({ error: 'Forbidden: Only the closet owner can manage it' });
    }

    next();
  } catch (error) {
    console.error('Error in canManageCloset middleware:', error);
    return res.status(500).send({ error: 'Internal server error' });
  }
};
