import { getUserModel } from '../../database/neo4j/models/index.js';
import { neogma } from '../../database/neo4j/neogma-client.js';
import { formatUser } from '../../utils/repository_utils/ObjectFormatters.js';
import type { IAuthRepository } from '../interfaces/IAuthRepository.js';
import type { User } from '../../dtos/users/User.dto.js';

export class Neo4jAuthRepository implements IAuthRepository {
  async register(data: {
    userId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    roleId: number;
    countryId: number;
  }): Promise<User[]> {
    try {
      const UserModel = getUserModel();

      const user = await UserModel.createOne({
        id:        data.userId,
        email:     data.email,
        password:  data.passwordHash,
        firstName: data.firstName,
        lastName:  data.lastName,
        createdAt: new Date().toISOString(),
      });

      await user.relateTo({ alias: 'role',    where: { id: data.roleId } });
      await user.relateTo({ alias: 'country', where: { id: data.countryId } });

      const result = await neogma.queryRunner.run(`
        MATCH (u:User { id: $id })-[:HAS]->(r:Role)
        MATCH (u)-[:IS_FROM]->(c:Country)
        RETURN u, r, c
      `, { id: user.id });

      return [formatUser(result.records[0]!, 'Neo4j')];
    } catch (error) {
      console.error('Error registering user in Neo4j:', error);
      throw new Error('Failed to register user in Neo4j');
    }
  }

  async findByEmail(email: string): Promise<{ users: User[]; passwordHash: string; roleName: string } | null> {
    try {
      const result = await neogma.queryRunner.run(`
        MATCH (u:User { email: $email })-[:HAS]->(r:Role)
        MATCH (u)-[:IS_FROM]->(c:Country)
        RETURN u, r, c
      `, { email });

      if (result.records.length === 0) return null;

      const record = result.records[0]!;
      const roleName = record.get('r').properties.role;
      return {
        users:        [formatUser(record, 'Neo4j')],
        passwordHash: record.get('u').properties.password,
        roleName,
      };
    } catch (error) {
      console.error('Error finding user by email in Neo4j:', error);
      throw new Error('Failed to find user in Neo4j');
    }
  }

  async findByIdWithRole(userId: string): Promise<{ users: User[]; roleName?: string } | null> {
    try {
      const result = await neogma.queryRunner.run(`
        MATCH (u:User { id: $id })-[:HAS]->(r:Role)
        MATCH (u)-[:IS_FROM]->(c:Country)
        RETURN u, r, c
      `, { id: userId });

      if (result.records.length === 0) return null;

      const record = result.records[0]!;
      const roleName = record.get('r').properties.role;
      return {
        users: [formatUser(record, 'Neo4j')],
        roleName,
      };
    } catch (error) {
      console.error('Error finding user by ID in Neo4j:', error);
      throw new Error('Failed to find user in Neo4j');
    }
  }

  async userHasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const result = await neogma.queryRunner.run(`
        MATCH (u:User { id: $id })-[:HAS]->(r:Role { role: $role })
        RETURN COUNT(*) as count
      `, { id: userId, role: roleName });

      return result.records[0]?.get('count') > 0;
    } catch (error) {
      console.error('Error checking user role in Neo4j:', error);
      return false;
    }
  }

  async getUsersByRole(roleName: string): Promise<User[]> {
    try {
      const result = await neogma.queryRunner.run(`
        MATCH (u:User)-[:HAS]->(r:Role { role: $role })
        MATCH (u)-[:IS_FROM]->(c:Country)
        RETURN u, r, c
      `, { role: roleName });

      return result.records.map((record) => formatUser(record, 'Neo4j'));
    } catch (error) {
      console.error('Error fetching users by role in Neo4j:', error);
      throw new Error('Failed to fetch users by role');
    }
  }
}
