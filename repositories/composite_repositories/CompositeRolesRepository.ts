import { isRepositoriesEnabled } from '../../utils/repository_utils/ErrorHandling.js';
import type { IRolesRepository } from '../interfaces/IRolesRepository.js';
import type { Role } from '../../dtos/roles/Role.dto.js';

export class CompositeRolesRepository implements IRolesRepository {
  constructor(private enabledRepos: IRolesRepository[]) {}

  async getAllRoles(): Promise<Role[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.getAllRoles()));
      return results.flat();
    } catch (error) {
      console.error('Error fetching roles from repositories:', error);
      throw error;
    }
  }

  async createRole(name: string): Promise<Role[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const results = await Promise.all(this.enabledRepos.map(repo => repo.createRole(name)));
      return results.flat();
    } catch (error) {
      console.error('Error creating role in repositories:', error);
      throw error;
    }
  }

  async deleteRole(name: string): Promise<void> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      await Promise.all(this.enabledRepos.map(repo => repo.deleteRole(name)));
    } catch (error) {
      console.error('Error deleting role from repositories:', error);
      throw error;
    }
  }
}
