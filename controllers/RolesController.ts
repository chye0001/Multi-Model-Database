import type { Request, Response } from 'express';
import type { RolesService } from '../services/RolesService.js';

export class RolesController {
  constructor(private rolesService: RolesService) {}

  getAllRoles = async (req: Request, res: Response) => {
    const roles = await this.rolesService.getAllRoles();
    res.send(roles);
  };

  createRole = async (req: Request, res: Response) => {
    try {
      const { name } = req.body;
      if (!name) {
        return res.status(400).send({ error: 'Role name is required' });
      }
      const role = await this.rolesService.createRole(name);
      res.status(201).send(role);
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to create role' });
    }
  };

  deleteRole = async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      await this.rolesService.deleteRole(name!);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).send({ error: error?.message ?? 'Failed to delete role' });
    }
  };
}
