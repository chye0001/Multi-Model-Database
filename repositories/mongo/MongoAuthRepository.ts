import { User, Country } from '../../database/mongo/models/index.js';
import { formatUser } from '../../utils/repository_utils/ObjectFormatters.js';
import type { IAuthRepository } from '../interfaces/IAuthRepository.js';
import type { User as UserDto } from '../../dtos/users/User.dto.js';

export class MongoAuthRepository implements IAuthRepository {
  async register(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    roleId: number;
    countryId: number;
  }): Promise<UserDto[]> {
    try {
      const country = await Country.findOne({ id: data.countryId }).lean().exec();
      if (!country) {
        throw new Error(`Country with id ${data.countryId} not found`);
      }

      const newUser = new User({
        id:        crypto.randomUUID(),
        email:     data.email,
        password:  data.passwordHash,
        firstName: data.firstName,
        lastName:  data.lastName,
        role:      { id: data.roleId, name: this.getRoleName(data.roleId) },
        country:   country._id,
      });

      await newUser.save();

      const saved = await User.findOne({ id: newUser.id }).populate('country').lean().exec();
      return [formatUser(saved!, 'MongoDB')];
    } catch (error) {
      console.error('Error registering user in MongoDB:', error);
      throw new Error('Failed to register user in MongoDB');
    }
  }

  async findByEmail(email: string): Promise<{ users: UserDto[]; passwordHash: string } | null> {
    try {
      const user = await User.findOne({ email }).populate('country').lean().exec();
      if (!user) return null;
      return { users: [formatUser(user, 'MongoDB')], passwordHash: user.password };
    } catch (error) {
      console.error('Error finding user by email in MongoDB:', error);
      throw new Error('Failed to find user in MongoDB');
    }
  }

  private getRoleName(roleId: number): string {
    switch (roleId) {
      case 1:  return 'admin';
      case 3:  return 'moderator';
      default: return 'user';
    }
  }
}
