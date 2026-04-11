import type { Request, Response } from 'express';
import type { AuthService } from '../services/AuthService.js';

export class AuthController {
  constructor(private authService: AuthService) {}

  register = async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, roleId, countryId } = req.body;
      if (!email || !password || !firstName || !lastName || !roleId || !countryId) {
        return res.status(400).send({ error: 'Missing required fields' });
      }

      const user = await this.authService.register({ email, password, firstName, lastName, roleId, countryId });
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

      const users = await this.authService.login(email, password);
      if (!users) {
        return res.status(401).send({ error: 'Invalid email or password' });
      }

      req.session.userId = users[0]!.id;
      res.send(users);
    } catch (error: any) {
      res.status(500).send({ error: error?.message ?? 'Login failed' });
    }
  };

  logout = async (req: Request, res: Response) => {
    req.session.destroy(() => {
      res.status(204).send();
    });
  };
}
