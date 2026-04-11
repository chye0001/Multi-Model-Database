import { prisma } from '../../database/postgres/prisma-client.js';
import type { IRolesRepository } from '../interfaces/IRolesRepository.js';
import type { Role } from '../../dtos/roles/Role.dto.js';

export class PostgresRolesRepository implements IRolesRepository {
  async getAllRoles(): Promise<Role[]> {
    try {
      const roles = await prisma.role.findMany();
      return roles.map(r => ({ ...r, fromDatabase: 'postgresql' }));
    } catch (error) {
      console.error('Error fetching roles from PostgreSQL:', error);
      throw new Error('Failed to fetch roles from PostgreSQL');
    }
  }

  async createRole(name: string): Promise<Role[]> {
    try {
      const role = await prisma.role.create({ data: { role: name } });
      return [{ ...role, fromDatabase: 'postgresql' }];
    } catch (error) {
      console.error('Error creating role in PostgreSQL:', error);
      throw new Error('Failed to create role in PostgreSQL');
    }
  }

  async deleteRole(name: string): Promise<void> {
    try {
      await prisma.role.delete({ where: { role: name } });
    } catch (error) {
      console.error('Error deleting role from PostgreSQL:', error);
      throw new Error('Failed to delete role from PostgreSQL');
    }
  }
}
