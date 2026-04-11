import bcrypt from 'bcrypt';
import type { PostgresAuthRepository } from '../repositories/postgres/PostgresAuthRepository.js';
import type { User } from '../dtos/users/User.dto.js';

export class AuthService {
  constructor(private authRepository: PostgresAuthRepository) {}

  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: number;
    countryId: number;
  }): Promise<User> {
    const passwordHash = await bcrypt.hash(data.password, 10);
    return await this.authRepository.register({ ...data, passwordHash });
  }

  async login(email: string, password: string): Promise<User | null> {
    const result = await this.authRepository.findByEmail(email);
    if (!result) return null;
    const match = await bcrypt.compare(password, result.passwordHash);
    if (!match) return null;
    return result.user;
  }
}
