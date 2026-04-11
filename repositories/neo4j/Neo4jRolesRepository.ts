import { getRoleModel } from '../../database/neo4j/models/index.js';
import { neogma } from '../../database/neo4j/neogma-client.js';
import type { IRolesRepository } from '../interfaces/IRolesRepository.js';
import type { Role } from '../../dtos/roles/Role.dto.js';

export class Neo4jRolesRepository implements IRolesRepository {
  async getAllRoles(): Promise<Role[]> {
    try {
      const result = await neogma.queryRunner.run(`MATCH (r:Role) RETURN r`);
      return result.records.map(record => {
        const r = record.get('r').properties;
        return { id: r.id, role: r.name, fromDatabase: 'neo4j' };
      });
    } catch (error) {
      console.error('Error fetching roles from Neo4j:', error);
      throw new Error('Failed to fetch roles from Neo4j');
    }
  }

  async createRole(name: string): Promise<Role[]> {
    try {
      const result = await neogma.queryRunner.run(`MATCH (r:Role) RETURN max(r.id) AS maxId`);
      const maxId = result.records[0]?.get('maxId') ?? 0;
      const nextId = (maxId as number) + 1;

      const RoleModel = getRoleModel();
      await RoleModel.createOne({ id: nextId, name });
      return [{ id: nextId, role: name, fromDatabase: 'neo4j' }];
    } catch (error) {
      console.error('Error creating role in Neo4j:', error);
      throw new Error('Failed to create role in Neo4j');
    }
  }

  async deleteRole(name: string): Promise<void> {
    try {
      await neogma.queryRunner.run(
        `MATCH (r:Role { name: $name }) DETACH DELETE r`,
        { name }
      );
    } catch (error) {
      console.error('Error deleting role from Neo4j:', error);
      throw new Error('Failed to delete role from Neo4j');
    }
  }
}
