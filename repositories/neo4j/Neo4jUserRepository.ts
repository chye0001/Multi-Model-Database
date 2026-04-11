import { 
    UserModel, 
    getRoleModel, 
    getCountryModel 
} from '../../database/neo4j/models/index.js';
import { neogma } from "../../database/neo4j/neogma-client.js";
import type { IUserRepository } from '../interfaces/IUserRepository.js';

import type { CreateUserRequest, UpdateUserRequest, User } from "../../dtos/users/User.dto.js";
import { formatUser, formatUserCloset, formatUserOutfit, formatUserReview } from '../../utils/repository_utils/ObjectFormatters.js';
import { format } from 'node:path';
import type { Closet } from '../../dtos/closets/Closet.dto.js';
import type { Outfit } from '../../dtos/outfits/Outfit.dto.js';
import type { Review } from '../../dtos/reviews/Review.dto.js';


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

    async getUserById(id: string): Promise<User[]> {
        try {
            const result = await neogma.queryRunner.run(
                `
                MATCH (u:User { id: $id })-[:HAS]->(r:Role)
                MATCH (u)-[:IS_FROM]->(c:Country)
                RETURN u, r, c
                LIMIT 1
                `,
                { id }
            );

            if (result.records.length === 0) {
                return [];
            }

            //@ts-ignore
            const userRecord = result.records[0];
            
            return [formatUser(userRecord, "neo4j")];

        } catch (error) {
            console.error(`Error getting user with id: ${id} in Neo4j:`, error);
            throw error; // Rethrowing the original error is usually better for debugging
        }
    }

    async createUser(data: Partial<CreateUserRequest>): Promise<User[]> {
        const result = await neogma.queryRunner.run(`
            MATCH (c:Country {id: $countryId})
            MATCH (r:Role {name: "user"})
            CREATE (u:User {
                id:        $id,
                email:     $email,
                password:  $password,
                firstName: $firstName,
                lastName:  $lastName,
                createdAt: $createdAt
            })
            CREATE (u)-[:IS_FROM]->(c)
            CREATE (u)-[:HAS]->(r)
            RETURN u, r, c
        `, {
            id:          data.id,
            email:       data.email,
            password:    data.password,
            firstName:   data.firstName,
            lastName:    data.lastName,
            createdAt:   new Date().toISOString(),
            countryId:   data.countryId,
        });

        return result.records.map((record) => formatUser(record, "neo4j"));
    }

    async updateUser(id: string, data: UpdateUserRequest): Promise<any[]> {
        try {
            if (!id) throw new Error("Missing required user id.");
            if (!data.firstName || !data.lastName || !data.countryId) {
                throw new Error(`Missing required data to update. Data received: ${JSON.stringify(data)}`);
            }

            const result = await neogma.queryRunner.run(`
                MATCH (u:User {id: $userId})
                MATCH (c:Country {id: $countryId})
                MATCH (r:Role)-[:HAS]-(u)
                SET u.firstName = $firstName,
                    u.lastName  = $lastName
                WITH u, c, r
                OPTIONAL MATCH (u)-[old:IS_FROM]->()
                DELETE old
                MERGE (u)-[:IS_FROM]->(c)
                RETURN u, r, c
                `, {
                    userId:    id,
                    firstName: data.firstName,
                    lastName:  data.lastName,
                    countryId: data.countryId,
                }
            );

            if (result.records.length === 0) {
                throw new Error(`User with id ${id} or country with id ${data.countryId} not found`);
            }

            return result.records.map(record => formatUser(record, "Neo4j"));

        } catch (error) {
            console.error(`Unexpected error, could not update user with id: ${id}`, error);
            throw new Error(`Failed to update user with id ${id}, unexpected error`);
        }
    }

    async deleteUser(id: string): Promise<void> {
        try {
            if (!id) throw new Error("Missing required user id.");

            const result = await neogma.queryRunner.run(`
                MATCH (u:User {id: $userId})
                DETACH DELETE u
                RETURN count(u) AS deleted
                `, {
                    userId: id,
                }
            );

            const deleted = result.records[0]?.get("deleted").toNumber();
            if (deleted === 0) {
                throw new Error(`User with id ${id} not found`);
            }

        } catch (error) {
            console.error(`Unexpected error, could not delete user with id: ${id}`, error);
            throw new Error(`Failed to delete user with id ${id}, unexpected error`);
        }
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

    async getAllUserClosets(userId: string): Promise<Closet[]> {
        try {
            if (!userId) throw new Error("Missing required user id.");

            const result = await neogma.queryRunner.run(`
                MATCH (u:User {id: $userId})-[r:CREATES]->(cl:Closet)
                OPTIONAL MATCH (cl)-[:STORES]->(i:Item)
                OPTIONAL MATCH (u2:User)-[:CO_CURATES]->(cl)
                RETURN cl,
                    r.createdAt                    AS createdAt,
                    collect(DISTINCT i.id)         AS itemIds,
                    collect(DISTINCT u2.id)        AS sharedWith
                `, {
                    userId,
                }
            );

            if (result.records.length === 0) return [];

            return result.records.map((record) => formatUserCloset(record, "neo4j"));

        } catch (error) {
            console.error(`Unexpected error, could not fetch closets for user: ${userId}`, error);
            throw new Error(`Failed to fetch closets for user ${userId}, unexpected error`);
        }
    }

    async getAllOutfitsByUserId(userId: string): Promise<Outfit[]> {
        try {
            if (!userId) throw new Error("Missing required user id.");

            const result = await neogma.queryRunner.run(`
                MATCH (u:User {id: $userId})-[rel:CREATES]->(o:Outfit)
                OPTIONAL MATCH (o)-[:CONTAINS]->(i:Item)
                OPTIONAL MATCH (i)-[:MADE_BY]->(b:Brand)
                OPTIONAL MATCH (i)-[:BELONGS_TO]->(cat:Category)
                OPTIONAL MATCH (i)-[:HAS]->(img:Image)
                OPTIONAL MATCH (reviewer:User)-[w:WRITES]->(rv:Review)-[:ABOUT]->(o)
                WITH o, u, rel, i, b, cat, img, rv, w, reviewer
                RETURN o,
                    u.id AS createdBy,
                    rel.dateAdded AS dateAdded,
                    collect(DISTINCT {
                        id:       i.id,
                        name:     i.name,
                        price:    i.price,
                        category: cat.name
                    }) AS rawItems,
                    collect(DISTINCT { itemId: i.id, brandId: b.id, brandName: b.name }) AS rawBrands,
                    collect(DISTINCT { itemId: i.id, imageId: img.id, imageUrl: img.url }) AS rawImages,
                    collect(DISTINCT {
                        id:          rv.id,
                        score:       rv.score,
                        text:        rv.text,
                        writtenBy:   reviewer.id,
                        dateWritten: w.dateWritten,
                        outfitId:    o.id
                    }) AS rawReviews
                `, { userId }
            );

            if (result.records.length === 0) return [];

            return result.records.map(record =>
                formatUserOutfit(record, "neo4j")
            );

        } catch (error) {
            console.error(`Unexpected error, could not fetch outfits for user: ${userId}`, error);
            throw new Error(`Failed to fetch outfits for user ${userId}, unexpected error`);
        }
    }

   async getAllReviewsByUserId(userId: string): Promise<Review[]> {
        try {
            if (!userId) throw new Error("Missing required user id.");

            const result = await neogma.queryRunner.run(`
            MATCH (u:User {id: $userId})-[w:WRITES]->(rv:Review)-[:ABOUT]->(o:Outfit)
            RETURN rv,
                u.id          AS writtenBy,
                w.dateWritten AS dateWritten,
                o.id          AS outfitId
            `, { userId });

            if (result.records.length === 0) return [];

            return result.records.map((record) => formatUserReview(record, "neo4j"));

        } catch (error) {
            console.error(`Unexpected error, could not fetch reviews for user: ${userId}`, error);
            throw new Error(`Failed to fetch reviews for user ${userId}, unexpected error`);
        }
    }

    // will get all the closets shared with the userId
    async getAllSharedClosetsByUserId(userId: string): Promise<Closet[]> {
        try {
            if (!userId) throw new Error("Missing required user id.");

            const result = await neogma.queryRunner.run(`
            MATCH (u:User {id: $userId})-[:CO_CURATES]->(cl:Closet)
            MATCH (owner:User)-[r:CREATES]->(cl)
            OPTIONAL MATCH (cl)-[:STORES]->(i:Item)
            OPTIONAL MATCH (sharedUser:User)-[:CO_CURATES]->(cl)
            RETURN cl,
                    owner.id                         AS userId,
                    r.createdAt                      AS createdAt,
                    collect(DISTINCT i.id)           AS itemIds,
                    collect(DISTINCT sharedUser.id)  AS sharedWith
            `, { userId });

            if (result.records.length === 0) return [];

            return result.records.map((record) => formatUserCloset(record, "neo4j"));

        } catch (error) {
            console.error(`Unexpected error, could not fetch shared closets for user: ${userId}`, error);
            throw new Error(`Failed to fetch shared closets for user ${userId}, unexpected error`);
        }
        }
}