import { isRepositoriesEnabled } from '../../utils/repository_utils/utils.js';

import type { IUserRepository } from '../interfaces/IUserRepository.js';


export class CompositeUserRepository implements IUserRepository {
  constructor(private enabledRepos: IUserRepository[]) {}

  async getAllUsers(): Promise<any[]> {
    try {     
      isRepositoriesEnabled(this.enabledRepos);
      const allUsersArrays = await Promise.all(this.enabledRepos.map(repo => repo.getAllUsers()));
      return allUsersArrays.flat();

    } catch (error) {
      console.error("Error fetching all users from repositories:", error);
      throw error;
    }
  }

  async getUserById(id: string): Promise<any[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const userArrays = await Promise.all(this.enabledRepos.map(repo => repo.getUserById(id)));
      return userArrays.flat();
      
    } catch (error) {
      console.error(`Error fetching user by ID ${id} from repositories:`, error);
      throw error;
    }
  }

  async createUser(data: Partial<any>): Promise<any[]> {
   try {
     isRepositoriesEnabled(this.enabledRepos);
     const createdUser = await Promise.all(this.enabledRepos.map(repo => repo.createUser(data)));
     return createdUser.flat();

    } catch (error) {
      console.error("Error creating user in repositories:", error);
      throw error;
    }
  }

  async updateUser(id: string, data: Partial<any>): Promise<any[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const updatedUsers = await Promise.all(this.enabledRepos.map(repo => repo.updateUser(id, data)));
      return updatedUsers.flat();

    } catch (error) {
      console.error(`Error updating user with ID ${id} in repositories:`, error);
      throw error;
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      await Promise.all(this.enabledRepos.map(repo => repo.deleteUser(id)));

    } catch (error) {
      console.error(`Error deleting user with ID ${id} in repositories:`, error);
      throw error;
    }
  }



  async getAllUserClosets(userId: string): Promise<any[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const allClosetsArrays = await Promise.all(this.enabledRepos.map(repo => repo.getAllUserClosets(userId)));
      return allClosetsArrays.flat();

    } catch (error) {
      console.error(`Error fetching closets for user ID ${userId} from repositories:`, error);
      throw error;
    }
  }

  async getAllOutfitsByUserId(userId: string): Promise<any[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const allOutfitsArrays = await Promise.all(this.enabledRepos.map(repo => repo.getAllOutfitsByUserId(userId)));
      return allOutfitsArrays.flat();

    } catch (error) {
      console.error(`Error fetching outfits for user ID ${userId} from repositories:`, error);
      throw error;
    }
  }

  async getAllReviewsByUserId(userId: string): Promise<any[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const allReviewsArrays = await Promise.all(this.enabledRepos.map(repo => repo.getAllReviewsByUserId(userId)));
      return allReviewsArrays.flat();

    } catch (error) {
      console.error(`Error fetching reviews for user ID ${userId} from repositories:`, error);
      throw error;
    }
  }

  async getAllSharedClosetsByUserId(userId: string): Promise<any[]> {
    try {
      isRepositoriesEnabled(this.enabledRepos);
      const allSharedClosetsArrays = await Promise.all(this.enabledRepos.map(repo => repo.getAllSharedClosetsByUserId(userId)));
      return allSharedClosetsArrays.flat();
      
    } catch (error) {
      console.error(`Error fetching shared closets for user ID ${userId} from repositories:`, error);
      throw error;
    }
  }
}
