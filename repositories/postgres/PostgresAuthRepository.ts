import { prisma } from '../../database/postgres/prisma-client.js';
import { formatUser } from '../../utils/repository_utils/ObjectFormatters.js';
import type { User } from '../../dtos/users/User.dto.js';
import type { IAuthRepository } from '../interfaces/IAuthRepository.js';

export class PostgresAuthRepository implements IAuthRepository {
  async register(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    roleId: number;
    countryId: number;
  }): Promise<User[]> {
    try {
      const user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: data.email,
          password: data.passwordHash,
          firstName: data.firstName,
          lastName: data.lastName,
          roleId: data.roleId,
          countryId: data.countryId,
        },
        include: { role: true, country: true },
      });
      return [formatUser(user, 'PostgreSQL')];
    } catch (error) {
      console.error('Error registering user in PostgreSQL:', error);
      throw new Error('Failed to register user');
    }
  }

  async findByEmail(email: string): Promise<{ users: User[]; passwordHash: string } | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true, country: true },
      });
      if (!user) return null;
      return { users: [formatUser(user, 'PostgreSQL')], passwordHash: user.password };
    } catch (error) {
      console.error('Error finding user by email in PostgreSQL:', error);
      throw new Error('Failed to find user');
    }
  }
}
