import { getUserModel } from '../../database/neo4j/models/index.js';
import { neogma } from '../../database/neo4j/neogma-client.js';
import { formatUser } from '../../utils/repository_utils/ObjectFormatters.js';
import type { IAuthRepository } from '../interfaces/IAuthRepository.js';
import type { User } from '../../dtos/users/User.dto.js';

export class Neo4jAuthRepository implements IAuthRepository {
  async register(data: {
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
        id:        crypto.randomUUID(),
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

  async findByEmail(email: string): Promise<{ users: User[]; passwordHash: string } | null> {
    try {
      const result = await neogma.queryRunner.run(`
        MATCH (u:User { email: $email })-[:HAS]->(r:Role)
        MATCH (u)-[:IS_FROM]->(c:Country)
        RETURN u, r, c
      `, { email });

      if (result.records.length === 0) return null;

      const record = result.records[0]!;
      return {
        users:        [formatUser(record, 'Neo4j')],
        passwordHash: record.get('u').properties.password,
      };
    } catch (error) {
      console.error('Error finding user by email in Neo4j:', error);
      throw new Error('Failed to find user in Neo4j');
    }
  }
}
