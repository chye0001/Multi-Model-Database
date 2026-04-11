import type { Role } from '../../dtos/roles/Role.dto.js';

export interface IRolesRepository {
  getAllRoles(): Promise<Role[]>;
  createRole(name: string): Promise<Role[]>;
  deleteRole(name: string): Promise<void>;
}
