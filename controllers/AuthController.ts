import type { Request, Response } from 'express';
import type { AuthService } from '../services/AuthService.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, countryId, roleId } = req.body;
      if (!email || !password || !firstName || !lastName || !countryId) {
        return res.status(400).send({ error: 'Missing required fields' });
      }
      const userId = crypto.randomUUID();
      // const roleId = 2; // standard user. 1 = admin
      const user = await this.authService.register({ userId, email, password, firstName, lastName, roleId, countryId });
      res.status(201).send(user);
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Registration failed' });
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).send({ error: 'Email and password are required' });
      }

      const result = await this.authService.login(email, password);
      if (!result) {
        return res.status(401).send({ error: 'Invalid email or password' });
      }

      // Store userId and role in session for RBAC
      req.session.userId = result.users[0]!.id;
      req.session.userRole = result.roleName;
      
      res.send(result.users);
    } catch (error: any) {
      res.status(500).send({ error: error?.message ?? 'Login failed' });
    }
  };

  logout = async (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.status(204).send();
    });
  };

  assignRole = async (req: Request, res: Response) => {
    try {
      const { userEmail, role } = req.body;
      if (!userEmail) {
        return res.status(400).send({ error: 'User email is required' });
      }
      if (!role) {
        return res.status(400).send({ error: 'Role name is required' });
      }
      const updated = await this.authService.assignRole(userEmail, role);
      res.send(updated);
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to assign role' });
    }
  };
}
