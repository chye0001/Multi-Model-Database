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
import { audit } from '../../utils/audit/AuditLogger.ts';


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
        audit({
            timestamp: new Date().toISOString(),
            event: 'NODE_CREATE',
            label: 'User',
            params: { id: data.id, email: data.email, firstName: data.firstName, lastName: data.lastName, countryId: data.countryId },
            source: 'Neo4jUserRepository.createUser',
        });
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
            id:        data.id,
            email:     data.email,
            password:  data.password,
            firstName: data.firstName,
            lastName:  data.lastName,
            createdAt: new Date().toISOString(),
            countryId: data.countryId,
        });
        return result.records.map((record) => formatUser(record, "neo4j"));
    }

    async updateUser(id: string, data: UpdateUserRequest): Promise<any[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'NODE_UPDATE',
            label: 'User',
            params: { id, firstName: data.firstName, lastName: data.lastName, countryId: data.countryId },
            source: 'Neo4jUserRepository.updateUser',
        });
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
        audit({
            timestamp: new Date().toISOString(),
            event: 'NODE_DELETE',
            label: 'User',
            params: { id },
            source: 'Neo4jUserRepository.deleteUser',
        });
        try {
            if (!id) throw new Error("Missing required user id.");
            const result = await neogma.queryRunner.run(`
                MATCH (u:User {id: $userId})
                DETACH DELETE u
                RETURN count(u) AS deleted
                `, { userId: id }
            );
            const deleted = result.records[0]?.get("deleted").toNumber();
            if (deleted === 0) throw new Error(`User with id ${id} not found`);
        } catch (error) {
            console.error(`Unexpected error, could not delete user with id: ${id}`, error);
            throw new Error(`Failed to delete user with id ${id}, unexpected error`);
        }
    }



    async assignRole(userEmail: string, roleName: string): Promise<any[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'RELATIONSHIP_CREATE',
            label: 'User-[:HAS]->Role',
            params: { userEmail, roleName },
            source: 'Neo4jUserRepository.assignRole',
        });
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
console.log("CALLLELDLEDLDLLELDÆÅØ")
            const result = await neogma.queryRunner.run(`
                MATCH (u:User {id: $userId})-[r:CREATES]->(cl:Closet)
                OPTIONAL MATCH (cl)-[:STORES]->(i:Item)
                OPTIONAL MATCH (shared:User)-[:CO_CURATES]->(cl)
                RETURN cl,
                    r.createdAt AS createdAt,
                    u.id AS userId,
                    collect(DISTINCT i.id) AS itemIds,
                    collect(DISTINCT CASE 
                        WHEN shared.id IS NOT NULL THEN {
                            id: shared.id,
                            firstName: shared.firstName,
                            lastName: shared.lastName,
                            email: shared.email
                        }
                    END) AS sharedWith
            `, { userId });
console.log(result.records.length, "@@@")
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
                OPTIONAL MATCH (b)-[:IS_FROM]->(country:Country)
                OPTIONAL MATCH (i)-[:BELONGS_TO]->(cat:Category)
                OPTIONAL MATCH (i)-[:HAS]->(img:Image)
                OPTIONAL MATCH (rv:Review)-[:ABOUT]->(o)
                OPTIONAL MATCH (reviewer:User)-[w:WRITES]->(rv)
                WITH o, 
                    u,
                    rel.dateAdded AS dateAdded,
                    i, b, cat, img, country,
                    rv, reviewer, w
                RETURN 
                    o,
                    {
                        id:        u.id,
                        firstName: u.firstName,
                        lastName:  u.lastName,
                        email:     u.email
                    } AS createdBy,
                    dateAdded,
                    collect(DISTINCT {
                        id:       i.id,
                        name:     i.name,
                        price:    i.price,
                        category: { categoryId: cat.id, name: cat.name }
                    }) AS rawItems,
                    collect(DISTINCT {
                        itemId:    i.id,
                        brandId:   b.id,
                        brandName: b.name,
                        countryId: country.id,
                        countryName: country.name,
                        countryCode: country.countryCode
                    }) AS rawBrands,
                    collect(DISTINCT {
                        itemId:   i.id,
                        imageId:  img.id,
                        imageUrl: img.url
                    }) AS rawImages,
                    collect(DISTINCT CASE 
                        WHEN rv.id IS NOT NULL THEN {
                            id:          rv.id,
                            score:       rv.score,
                            text:        rv.text,
                            dateWritten: w.dateWritten,
                            outfitId:    o.id,
                            writtenBy: {
                                id:        reviewer.id,
                                firstName: reviewer.firstName,
                                lastName:  reviewer.lastName,
                                email:     reviewer.email
                            }
                        }
                    END) AS rawReviews
            `, { userId });

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
                    {
                        id: u.id,
                        firstName: u.firstName,
                        lastName: u.lastName,
                        email: u.email
                    } AS writtenBy,
                    w.dateWritten AS dateWritten,
                    o.id AS outfitId
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
            OPTIONAL MATCH (sharedUser:User)-[:CO_CURATES]->(cl)
            OPTIONAL MATCH (cl)-[:STORES]->(i:Item)
            RETURN cl,
                    owner.id                         AS userId,
                    r.createdAt                      AS createdAt,
                    collect(DISTINCT i.id)           AS itemIds,
                    [item IN collect(DISTINCT CASE
                        WHEN sharedUser.id IS NOT NULL THEN {
                            id: sharedUser.id,
                            firstName: sharedUser.firstName,
                            lastName: sharedUser.lastName,
                            email: sharedUser.email
                        }
                    END) WHERE item IS NOT NULL] AS sharedWith
            `, { userId });

            if (result.records.length === 0) return [];

            return result.records.map((record) => formatUserCloset(record, "neo4j"));

        } catch (error) {
            console.error(`Unexpected error, could not fetch shared closets for user: ${userId}`, error);
            throw new Error(`Failed to fetch shared closets for user ${userId}, unexpected error`);
        }
        }
}