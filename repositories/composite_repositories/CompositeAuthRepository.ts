import { isRepositoriesEnabled } from '../../utils/repository_utils/ErrorHandling.js';
import type { IAuthRepository } from '../interfaces/IAuthRepository.js';
import type { User } from '../../dtos/users/User.dto.js';

export class CompositeAuthRepository implements IAuthRepository {
  constructor(private enabledRepos: IAuthRepository[]) {}

  async register(data: {
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

  async findByEmail(email: string): Promise<{ users: User[]; passwordHash: string } | null> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.findByEmail(email)));
      const found = results.filter(r => r !== null);
      if (found.length === 0) return null;
      return {
        users:        found.flatMap(r => r.users),
        passwordHash: found[0]!.passwordHash,
      };
    } catch (error) {
      console.error('Error finding user by email in repositories:', error);
      throw error;
    }
  }
}
