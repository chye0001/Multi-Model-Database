import type { IUserRepository } from "../repositories/interfaces/IUserRepository.js";



export class UserService {
  constructor(private userRepository: IUserRepository) {}

  async getAllUsers(): Promise<any[]> {
    return await this.userRepository.getAllUsers();
  }

  async getUserById(id: string): Promise<any> {
    return await this.userRepository.getUserById(id);
  }

  async createUser(data: Partial<any>): Promise<any[]> {
    return await this.userRepository.createUser(data);
  }

  async updateUser(id: string, data: Partial<any>): Promise<any[]> {
    return await this.userRepository.updateUser(id, data);
  }

  async deleteUser(id: string): Promise<void> {
    await this.userRepository.deleteUser(id);
  }



  async getAllUserClosets(userId: string): Promise<any[]> {
    return await this.userRepository.getAllUserClosets(userId);
  }

  async getAllOutfitsByUserId(userId: string): Promise<any[]> {
    return await this.userRepository.getAllOutfitsByUserId(userId);
  }

  async getAllReviewsByUserId(userId: string): Promise<any[]> {
    return await this.userRepository.getAllReviewsByUserId(userId);
  }

  async getAllSharedClosetsByUserId(userId: string): Promise<any[]> {
    return await this.userRepository.getAllSharedClosetsByUserId(userId);
  }
}
