import { 
    UserModel, 
    getRoleModel, 
    getCountryModel 
} from '../../database/neo4j/models/index.js';
import { neogma } from "../../database/neo4j/neogma-client.js";
import type { IUserRepository } from '../interfaces/IUserRepository.js';

import type { User } from "../../dtos/users/User.dto.js";
import { formatUser } from '../../utils/repository_utils/ObjectFormatters.js';


export class Neo4jUserRepository implements IUserRepository {

    async getAllUsers(): Promise<User[]> {
        try {
            const result = await neogma.queryRunner.run(`
                MATCH (u:User)-[:HAS]->(r:Role)
                MATCH (u)-[:IS_FROM]->(c:Country)
                RETURN u, r, c
            `);

            return result.records.map(record => { return formatUser(record, "neo4j"); });

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



    async assignRole(userEmail: string, roleName: string): Promise<any[]> {
        try {
            await neogma.queryRunner.run(`
                MATCH (u:User { email: $userEmail })-[rel:HAS]->(old:Role)
                DELETE rel
                WITH u
                MATCH (r:Role { name: $roleName })
                CREATE (u)-[:HAS]->(r)
            `, { userEmail, roleName });

            const result = await neogma.queryRunner.run(`
                MATCH (u:User { email: $userEmail })-[:HAS]->(r:Role)
                MATCH (u)-[:IS_FROM]->(c:Country)
                RETURN u, r, c
            `, { userEmail });

            if (result.records.length === 0) throw new Error('User not found');
            return [formatUser(result.records[0]!, 'neo4j')];
        } catch (error) {
            console.error(`Error assigning role to user with email ${userEmail} in Neo4j:`, error);
            throw new Error('Failed to assign role in Neo4j');
        }
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