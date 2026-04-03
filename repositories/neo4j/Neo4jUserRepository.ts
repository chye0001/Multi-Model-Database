import { UserModel } from '../../database/neo4j/models/index.js';
import type { IUserRepository } from '../interfaces/IUserRepository.js';



export class Neo4jUserRepository implements IUserRepository {

    async getAllUsers(): Promise<any[]> {
        try {
            const users = await UserModel.findMany();

            // const modifiedUsers = users.map(user => ({
            //     ...user.getProperties(), // extract plain node properties
            //     fromDatabase: "Neo4j"
            // }));

            return users;

        } catch (error) {
            console.error("Error fetching users from Neo4j:", error);
            throw new Error("Failed to fetch users from Neo4j");
        }
    }

    async getUserById(id: string): Promise<any> {
        // Implement logic to fetch a user by ID from Neo4j
        return null;
    }

    async createUser(data: Partial<any>): Promise<any[]> {
        // Implement logic to create a new user in Neo4j
        return [];
    }

    async updateUser(id: string, data: Partial<any>): Promise<any[]> {
        // Implement logic to update an existing user in Neo4j
        return [];
    }

    async deleteUser(id: string): Promise<void> {
        // Implement logic to delete a user from Neo4j
    }



    async getAllUserClosets(userId: string): Promise<any[]> {
        // Implement logic to fetch all closets for a user from Neo4j
        return [];
    }

    async getAllOutfitsByUserId(userId: string): Promise<any[]> {
        // Implement logic to fetch all outfits for a user from Neo4j
        return [];
    }

    async getAllReviewsByUserId(userId: string): Promise<any[]> {
        // Implement logic to fetch all reviews for a user from Neo4j
        return [];
    }

    async getAllSharedClosetsByUserId(userId: string): Promise<any[]> {
        // Implement logic to fetch all shared closets for a user from Neo4j
        return [];
    }
}