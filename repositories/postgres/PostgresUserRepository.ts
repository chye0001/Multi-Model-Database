import type { IUserRepository } from '../interfaces/IUserRepository.js';
import { formatUser, formatUserOutfit, formatUserCloset, formatUserReview } from "../../utils/repository_utils/ObjectFormatters.js";
import type { CreateUserRequest, UpdateUserRequest, User } from '../../dtos/users/User.dto.js';
import type { Closet } from '../../dtos/closets/Closet.dto.js';
import type { Outfit } from '../../dtos/outfits/Outfit.dto.js';
import type { Review } from '../../dtos/reviews/Review.dto.js';

import { prisma } from '../../database/postgres/prisma-client.js';
import { audit } from '../../utils/audit/AuditLogger.ts';

export class PostgresUserRepository implements IUserRepository {

    async getAllUsers(): Promise<User[]> {
        try {
            const users = await prisma.user.findMany({
                include: {
                    role:    true,
                    country: true
                }
            });

            return users.map(user => formatUser(user, "PostgreSQL"));

        } catch (error) {
            console.error("Error fetching users from PostgreSQL:", error);
            throw new Error("Failed to fetch users from PostgreSQL");
        }
    }

    async getUserById(id: string): Promise<User[]> {
        try {
            const user = await prisma.user.findUnique({
                where: { id },
                include: {
                    role:    true,
                    country: true
                }
            });

            if (!user) return [];

            return [formatUser(user, "PostgreSQL")];

        } catch (error) {
            console.error("Error fetching user from PostgreSQL:", error);
            throw new Error(`Failed to fetch user with id ${id} from PostgreSQL`);
        }
    }

    async createUser(data: CreateUserRequest): Promise<User[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'ROW_INSERT',
            label: 'users',
            params: { id: data.id, email: data.email, firstName: data.firstName, lastName: data.lastName, countryId: data.countryId },
            source: 'PostgresUserRepository.createUser',
        });
        
        try {
            const newUser = await prisma.user.create({
                data: {
                    id:        data.id,
                    email:     data.email,
                    password:  data.password,
                    firstName: data.firstName,
                    lastName:  data.lastName,
                    roleId:    2,
                    countryId: data.countryId
                },
                include: { role: true, country: true }
            });
            return [formatUser(newUser, "PostgreSQL")];
        } catch (error) {
            console.error("Error creating user in PostgreSQL:", error);
            throw new Error("Failed to create user in PostgreSQL");
        }
    }

    async updateUser(id: string, data: UpdateUserRequest): Promise<User[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'ROW_UPDATE',
            label: 'users',
            params: { id, firstName: data.firstName, lastName: data.lastName, countryId: data.countryId },
            source: 'PostgresUserRepository.updateUser',
        });
        
        try {
            if (!data.firstName || !data.lastName || !data.countryId) {
                throw new Error(`Missing required data to update. Data received: ${JSON.stringify(data)}`);
            }
            const updatedUser = await prisma.user.update({
                where: { id },
                data: {
                    firstName: data.firstName,
                    lastName:  data.lastName,
                    countryId: data.countryId
                },
                include: { role: true, country: true }
            });
            return [formatUser(updatedUser, "PostgreSQL")];
        } catch (error) {
            console.error("Error updating user in PostgreSQL:", error);
            throw new Error(`Failed to update user with id ${id} in PostgreSQL`);
        }
    }


    async deleteUser(id: string): Promise<void> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'ROW_DELETE',
            label: 'users',
            params: { id },
            source: 'PostgresUserRepository.deleteUser',
        });

        try {
            await prisma.user.delete({ where: { id } });

        } catch (error) {
            console.error("Error deleting user from PostgreSQL:", error);
            throw new Error(`Failed to delete user with id ${id} from PostgreSQL`);
        }
    }

    async assignRole(userEmail: string, roleName: string): Promise<User[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'ROW_UPDATE',
            label: 'users.roleId',
            params: { userEmail, roleName },
            source: 'PostgresUserRepository.assignRole',
        });
        
        try {
            const updated = await prisma.user.update({
                where: { email: userEmail },
                data:  { role: { connect: { role: roleName } } },
                include: { role: true, country: true },
            });
            return [formatUser(updated, "PostgreSQL")];
        } catch (error) {
            console.error(`Error assigning role to user ${userEmail} in PostgreSQL:`, error);
            throw new Error("Failed to assign role in PostgreSQL");
        }
    }

    async getAllUserClosets(userId: string): Promise<Closet[]> {
        try {
            const closets = await prisma.closet.findMany({
                where: { userId },
                include: {
                    closetItem:   true,
                    sharedCloset: {
                        include: {
                            user: true  // needed to build the sharedWith snapshot
                        }
                    }
                }
            });

            return closets.map(closet => formatUserCloset(closet, "postgresql"));

        } catch (error) {
            console.error("Error fetching user closets from PostgreSQL:", error);
            throw new Error(`Failed to fetch closets for user ${userId} from PostgreSQL`);
        }
    }

    async getAllOutfitsByUserId(userId: string): Promise<Outfit[]> {
        try {
            const outfits = await prisma.outfit.findMany({
                where: { createdBy: userId },
                include: {
                    user: true,   // needed to build the createdBy snapshot
                    outfitItems: {
                        include: {
                            closetItem: {
                                include: {
                                    item: {
                                        include: {
                                            category:   true,
                                            images:     true,
                                            itemBrands: {
                                                include: {
                                                    brand: {
                                                        include: { country: true }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    reviews: {
                        include: {
                            user: true  // needed to build the writtenBy snapshot
                        }
                    }
                }
            });

            return outfits.map(outfit => formatUserOutfit(outfit, "postgresql"));

        } catch (error) {
            console.error("Error fetching user outfits from PostgreSQL:", error);
            throw new Error(`Failed to fetch outfits for user ${userId} from PostgreSQL`);
        }
    }

    async getAllReviewsByUserId(userId: string): Promise<Review[]> {
        try {
            const reviews = await prisma.review.findMany({
                where: { writtenBy: userId },
                include: {
                    user: true  // needed to build the writtenBy snapshot
                }
            });

            return reviews.map(review => formatUserReview(review, "postgresql"));

        } catch (error) {
            console.error("Error fetching user reviews from PostgreSQL:", error);
            throw new Error(`Failed to fetch reviews for user ${userId} from PostgreSQL`);
        }
    }

    async getAllSharedClosetsByUserId(userId: string): Promise<Closet[]> {
        try {
            const sharedClosets = await prisma.closet.findMany({
                where: {
                    sharedCloset: {
                        some: { userId }
                    }
                },
                include: {
                    closetItem: {
                        include: {
                            item: true
                        }
                    },
                    sharedCloset: {
                        include: {
                            user: true  // needed to build the sharedWith snapshot
                        }
                    }
                }
            });

            return sharedClosets.map(closet => formatUserCloset(closet, "postgresql"));

        } catch (error) {
            console.error("Error fetching shared closets from PostgreSQL:", error);
            throw new Error(`Failed to fetch shared closets for user ${userId} from PostgreSQL`);
        }
    }
}
