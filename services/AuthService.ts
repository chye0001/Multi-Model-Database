import bcrypt from 'bcrypt';
import type { IAuthRepository } from '../repositories/interfaces/IAuthRepository.js';
import type { User } from '../dtos/users/User.dto.js';

export class AuthService {
  constructor(private authRepository: IAuthRepository) {}

  async register(data: {
    userId: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: number;
    countryId: number;
  }): Promise<User[]> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    return await this.authRepository.register({ ...data, passwordHash });
  }

  async login(
    email: string,
    password: string
  ): Promise<{ users: User[]; roleName: string } | null> {
    const result = await this.authRepository.findByEmail(email);
    if (!result) return null;
    const match = await bcrypt.compare(password, result.passwordHash);
    if (!match) return null;
    return { users: result.users, roleName: result.roleName };
  }

  async getUserRole(userId: string): Promise<string | null> {
    const result = await this.authRepository.findByIdWithRole(userId);
    return result?.roleName ?? null;
  }

  async userHasRole(userId: string, roleName: string): Promise<boolean> {
    return await this.authRepository.userHasRole(userId, roleName);
  }
}
