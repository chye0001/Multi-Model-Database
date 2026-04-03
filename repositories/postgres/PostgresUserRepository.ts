import type { IUserRepository } from '../interfaces/IUserRepository.js';

import { prisma } from '../../database/postgres/prisma-client.js';



export class PostgresUserRepository implements IUserRepository {
    async getAllUsers(): Promise<any[]> {
        try {
            const users = await prisma.user.findMany();
            const modifiedUsers = users.map(user => {
                //@ts-ignore just to distinguish the source of the data
                user.fromDatabase = "PostgreSQL";
                return user;
            });
            return modifiedUsers;

        } catch (error) {
            console.error("Error fetching users from PostgreSQL:", error);
            throw new Error("Failed to fetch users from PostgreSQL");
        }
    }

    async getUserById(id: string): Promise<any> {
        // Implement logic to fetch a user by ID from PostgreSQL
        return null;
    }

    async createUser(data: Partial<any>): Promise<any[]> {
        // Implement logic to create a new user in PostgreSQL
        return [];
    }

    async updateUser(id: string, data: Partial<any>): Promise<any[]> {
        // Implement logic to update an existing user in PostgreSQL
        return [];
    }

    async deleteUser(id: string): Promise<void> {
        // Implement logic to delete a user from PostgreSQL
    }



    async getAllUserClosets(userId: string): Promise<any[]> {
        // Implement logic to fetch all closets for a user from PostgreSQL
        return [];
    }

    async getAllOutfitsByUserId(userId: string): Promise<any[]> {
        // Implement logic to fetch all outfits for a user from PostgreSQL
        return [];
    }

    async getAllReviewsByUserId(userId: string): Promise<any[]> {
        // Implement logic to fetch all reviews for a user from PostgreSQL
        return [];
    }

    async getAllSharedClosetsByUserId(userId: string): Promise<any[]> {
        // Implement logic to fetch all shared closets for a user from PostgreSQL
        return [];
    }
}
