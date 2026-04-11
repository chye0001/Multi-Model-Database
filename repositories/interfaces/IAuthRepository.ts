import type { User } from '../../dtos/users/User.dto.js';

export interface IAuthRepository {
  register(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    roleId: number;
    countryId: number;
  }): Promise<User>;

  findByEmail(email: string): Promise<{ user: User; passwordHash: string } | null>;
}
