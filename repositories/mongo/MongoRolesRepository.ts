import { Role, User } from '../../database/mongo/models/index.js';
import type { IRolesRepository } from '../interfaces/IRolesRepository.js';
import type { Role as RoleDto } from '../../dtos/roles/Role.dto.js';

export class MongoRolesRepository implements IRolesRepository {
  async getAllRoles(): Promise<RoleDto[]> {
    try {
      const roles = await Role.find().lean().exec();
      return roles.map(r => ({ id: r.id, role: r.name, fromDatabase: 'mongodb' }));
    } catch (error) {
      console.error('Error fetching roles from MongoDB:', error);
      throw new Error('Failed to fetch roles from MongoDB');
    }
  }

  async createRole(name: string): Promise<RoleDto[]> {
    try {
      const max = await Role.findOne().sort({ id: -1 }).lean().exec();
      const nextId = max ? max.id + 1 : 1;
      const role = await Role.create({ id: nextId, name });
      return [{ id: role.id, role: role.name, fromDatabase: 'mongodb' }];
    } catch (error) {
      console.error('Error creating role in MongoDB:', error);
      throw new Error('Failed to create role in MongoDB');
    }
  }

  async deleteRole(name: string): Promise<void> {
    try {
      const result = await Role.deleteOne({ name }).exec();
      if (result.deletedCount === 0) {
        throw new Error(`Role "${name}" not found`);
      }
    } catch (error) {
      console.error('Error deleting role from MongoDB:', error);
      throw new Error('Failed to delete role from MongoDB');
    }
  }
}
