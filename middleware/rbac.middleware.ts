import type { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user is authenticated
 */
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).send({ error: 'Unauthorized: Please log in' });
  }
  next();
};

/**
 * Middleware to check if user is admin
 */
export const isAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).send({ error: 'Unauthorized: Please log in' });
  }

  if (req.session.userRole !== 'admin') {
    return res.status(403).send({ error: 'Forbidden: Admin access required' });
  }

  next();
};

/**
 * Middleware factory to check if user has specific role(s)
 * @param allowedRoles - Array of role names that are allowed
 */
export const hasRole = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).send({ error: 'Unauthorized: Please log in' });
    }

    if (!req.session.userRole || !allowedRoles.includes(req.session.userRole)) {
      return res.status(403).send({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

/**
 * Middleware to check if user owns the requested resource
 * Assumes userId is in req.params.id or req.params.userId
 * Admins bypass this check
 */
export const isResourceOwner = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).send({ error: 'Unauthorized: Please log in' });
  }

  const resourceUserId = req.params.id || req.params.userId;
  if (req.session.userId !== resourceUserId && req.session.userRole !== 'admin') {
    return res.status(403).send({ error: 'Forbidden: You do not own this resource' });
  }

  next();
};

