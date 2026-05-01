import { prisma } from '../../database/postgres/prisma-client.js';
import { formatUser } from '../../utils/repository_utils/ObjectFormatters.js';
import { audit } from '../../utils/audit/AuditLogger.js';
import type { User } from '../../dtos/users/User.dto.js';
import type { IAuthRepository } from '../interfaces/IAuthRepository.js';

export class PostgresAuthRepository implements IAuthRepository {
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
      const user = await prisma.user.create({
        data: {
          id: data.userId,
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
      throw new Error('Failed to register user in PostgreSQL');
    }
  }

  async findByEmail(email: string): Promise<{ users: User[]; passwordHash: string; roleName: string } | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: { role: true, country: true },
      });
      if (!user) return null;
      return {
        users: [formatUser(user, 'PostgreSQL')],
        passwordHash: user.password,
        roleName: user.role.role, // Include role name for session
      };
    } catch (error) {
      console.error('Error finding user by email in PostgreSQL:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Find user by ID with role information (useful for RBAC checks)
   */
  async findByIdWithRole(
    userId: string
  ): Promise<{ users: User[]; roleName?: string } | null> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true, country: true },
      });
      if (!user) return null;
      return {
        users: [formatUser(user, 'PostgreSQL')],
        roleName: user.role.role,
      };
    } catch (error) {
      console.error('Error finding user by ID in PostgreSQL:', error);
      throw new Error('Failed to find user');
    }
  }

  /**
   * Check if user has specific role (utility for RBAC)
   */
  async userHasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });
      return user?.role.role === roleName;
    } catch (error) {
      console.error('Error checking user role in PostgreSQL:', error);
      return false;
    }
  }

  /**
   * Get all users with specific role
   */
  async getUsersByRole(roleName: string): Promise<User[]> {
    try {
      const users = await prisma.user.findMany({
        where: {
          role: {
            role: roleName,
          },
        },
        include: { role: true, country: true },
      });
      return users.map((u) => formatUser(u, 'PostgreSQL'));
    } catch (error) {
      console.error('Error fetching users by role in PostgreSQL:', error);
      throw new Error('Failed to fetch users by role');
    }
  }

  async assignRole(userEmail: string, roleName: string): Promise<User[]> {
    audit({
      timestamp: new Date().toISOString(),
      event: 'ROW_UPDATE',
      label: 'users.roleId',
      params: { userEmail, roleName },
      source: 'PostgresAuthRepository.assignRole',
    });
    try {
      const updated = await prisma.user.update({
        where: { email: userEmail },
        data:  { role: { connect: { role: roleName } } },
        include: { role: true, country: true },
      });
      return [formatUser(updated, 'PostgreSQL')];
    } catch (error) {
      console.error(`Error assigning role to user ${userEmail} in PostgreSQL:`, error);
      throw new Error('Failed to assign role in PostgreSQL');
    }
  }
}
