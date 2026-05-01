import type { User } from '../../dtos/users/User.dto.js';

export interface IAuthRepository {
  register(data: {
    userId: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    roleId: number;
    countryId: number;
  }): Promise<User[]>;

  // Login logic is handled at the service layer (password verification)
  // Repository provides findByEmail() to support login flow
  findByEmail(email: string): Promise<{ users: User[]; passwordHash: string; roleName: string } | null>;

  // RBAC support
  findByIdWithRole(userId: string): Promise<{ users: User[]; roleName?: string } | null>;
  userHasRole(userId: string, roleName: string): Promise<boolean>;
  getUsersByRole(roleName: string): Promise<User[]>;
  assignRole(userEmail: string, roleName: string): Promise<User[]>;
}
