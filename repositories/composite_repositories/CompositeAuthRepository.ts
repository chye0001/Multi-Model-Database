import { isRepositoriesEnabled } from '../../utils/repository_utils/ErrorHandling.js';
import type { IAuthRepository } from '../interfaces/IAuthRepository.js';
import type { User } from '../../dtos/users/User.dto.js';

export class CompositeAuthRepository implements IAuthRepository {
  constructor(private enabledRepos: IAuthRepository[]) {}

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
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.register(data)));
      return results.flat();
    } catch (error) {
      console.error('Error registering user in repositories:', error);
      throw error;
    }
  }

  async findByEmail(email: string): Promise<{ users: User[]; passwordHash: string; roleName: string } | null> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.findByEmail(email)));
      const found = results.filter(r => r !== null);
      if (found[0]?.roleName === undefined) throw new Error("Missing role on user");
      if (found.length === 0) return null;
      return {
        users:        found.flatMap(r => r.users),
        passwordHash: found[0]!.passwordHash,
        roleName:     found[0]?.roleName,
      };
    } catch (error) {
      console.error('Error finding user by email in repositories:', error);
      throw error;
    }
  }

  async findByIdWithRole(userId: string): Promise<{ users: User[]; roleName?: string } | null> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.findByIdWithRole(userId)));
      const found = results.filter(r => r !== null);
      if (found[0]?.roleName === undefined) return null;
      if (found.length === 0) return null;
      return {
        users:    found.flatMap(r => r.users),
        roleName: found[0]?.roleName,
      };
    } catch (error) {
      console.error('Error finding user by ID with role in repositories:', error);
      throw error;
    }
  }

  async userHasRole(userId: string, roleName: string): Promise<boolean> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.userHasRole(userId, roleName)));
      // Return true if at least one repository confirms the user has the role
      return results.some(r => r === true);
    } catch (error) {
      console.error('Error checking user role in repositories:', error);
      throw error;
    }
  }

  async getUsersByRole(roleName: string): Promise<User[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.getUsersByRole(roleName)));
      return results.flat();
    } catch (error) {
      console.error('Error fetching users by role in repositories:', error);
      throw error;
    }
  }
}
