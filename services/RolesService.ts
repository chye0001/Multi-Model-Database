import type { IRolesRepository } from '../repositories/interfaces/IRolesRepository.js';
import type { Role } from '../dtos/roles/Role.dto.js';

export class RolesService {
  constructor(private rolesRepository: IRolesRepository) {}

  async getAllRoles(): Promise<Role[]> {
    return await this.rolesRepository.getAllRoles();
  }

  async createRole(name: string): Promise<Role[]> {
    return await this.rolesRepository.createRole(name);
  }

  async deleteRole(name: string): Promise<void> {
    await this.rolesRepository.deleteRole(name);
  }
}
