import type { IUserRepository } from '../interfaces/IUserRepository.js';

import type { User } from '../../dtos/users/User.dto.js';
import type { Closet, SharedCloset } from '../../dtos/closets/Closet.dto.js';
import type { Outfit } from '../../dtos/outfits/Outfit.dto.js';
import type { Review } from '../../dtos/reviews/Review.dto.js';
import type { ClothingItem, ItemImage } from '../../dtos/items/Item.dto.js';
import type { Brand } from '../../dtos/brands/Brand.dto.js';

import { prisma } from '../../database/postgres/prisma-client.js';



export class PostgresUserRepository implements IUserRepository {
    
    async getAllUsers(): Promise<User[]> {
        try {
            const users = await prisma.user.findMany({
                include: {
                    role: true,
                    country: true
                }
            });
            
            return users.map(user => this.formatUser(user));

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
                    role: true,
                    country: true
                }
            });

            if (!user) {
                return [];
            }

            return [this.formatUser(user)];

        } catch (error) {
            console.error("Error fetching user from PostgreSQL:", error);
            throw new Error(`Failed to fetch user with id ${id} from PostgreSQL`);
        }
    }

    async createUser(data: Partial<any>): Promise<User[]> {
        try {
            const newUser = await prisma.user.create({
                data: {
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    roleId: data.roleId,
                    countryId: data.countryId
                },
                include: {
                    role: true,
                    country: true
                }
            });

            return [this.formatUser(newUser)];

        } catch (error) {
            console.error("Error creating user in PostgreSQL:", error);
            throw new Error("Failed to create user in PostgreSQL");
        }
    }

    async updateUser(id: string, data: Partial<any>): Promise<User[]> {
        try {
            const updatedUser = await prisma.user.update({
                where: { id },
                data: {
                    email: data.email,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    roleId: data.roleId,
                    countryId: data.countryId
                },
                include: {
                    role: true,
                    country: true
                }
            });

            return [this.formatUser(updatedUser)];
        
        } catch (error) {
            console.error("Error updating user in PostgreSQL:", error);
            throw new Error(`Failed to update user with id ${id} in PostgreSQL`);
        }
    }

    async deleteUser(id: string): Promise<void> {
        try {
            await prisma.user.delete({
                where: { id }
            });

        } catch (error) {
            console.error("Error deleting user from PostgreSQL:", error);
            throw new Error(`Failed to delete user with id ${id} from PostgreSQL`);
        }
    }



    async getAllUserClosets(userId: string): Promise<Closet[]> {
        try {
            const closets = await prisma.closet.findMany({
                where: { userId }
            });

            return closets.map(closet => this.formatUserCloset(closet));

        } catch (error) {
            console.error("Error fetching user closets from PostgreSQL:", error);
            throw new Error(`Failed to fetch closets for user with id ${userId} from PostgreSQL`);
        }
    }

    async getAllOutfitsByUserId(userId: string): Promise<Outfit[]> {
        try {
            const outfits = await prisma.outfit.findMany({
                where: { createdBy: userId },
                include: {
                    outfitItems: {
                        include: {
                            closetItem: {
                                include: {
                                    item: {
                                        include: {
                                            category: true,
                                            image: true,
                                            itemBrand: {
                                                include: {
                                                    brand: {
                                                        include: {
                                                            country: true
                                                        }
                                                    }
                                                }
                                            }
                                        }   
                                    } 
                                } 
                            }
                        }
                    },
                    reviews: true
                }
            });

            return outfits.map(outfit => this.formatUserOutfit(outfit));

        } catch (error) {
            console.error("Error fetching user outfits from PostgreSQL:", error);
            throw new Error(`Failed to fetch outfits for user with id ${userId} from PostgreSQL`);
        }
    }

    async getAllReviewsByUserId(userId: string): Promise<Review[]> {
        try {
            const reviews = await prisma.review.findMany({
                where: { writtenBy: userId }
            });

            return reviews.map(review => this.formatUserReview(review));

        } catch (error) {
            console.error("Error fetching user reviews from PostgreSQL:", error);
            throw new Error(`Failed to fetch reviews for user with id ${userId} from PostgreSQL`);
        }
    }

    async getAllSharedClosetsByUserId(userId: string): Promise<SharedCloset[]> {
        try {
            // Get all closets owned by the user that are shared with others
            const sharedClosets = await prisma.closet.findMany({
                where: { 
                    userId,
                    sharedCloset: {
                        some: {} // closets that have at least one shared relationship
                    }
                },
                include: {
                    sharedCloset: {
                        include: {
                            user: true // include the users the closet is shared with
                        }
                    },
                    closetItem: {
                        include: {
                            item: true
                        }
                    }
                }
            });

            return sharedClosets.map(closet => this.formatUserSharedCloset(closet));

        } catch (error) {
            console.error("Error fetching shared closets for user from PostgreSQL:", error);
            throw new Error(`Failed to fetch shared closets for user with id ${userId} from PostgreSQL`);
        }
    }



    //---------------------------------------------------------------------------------------------
    // [START Helper Methods]
    //---------------------------------------------------------------------------------------------
    private formatUser(user: any): User {
        return {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            createdAt: user.createdAt,
            role: user.role.role,
            country: {
                id: user.country.id,
                name: user.country.name,
                countryCode: user.country.countryCode
            },
            fromDatabase: "PostgreSQL"
        };
    }

    private formatUserCloset(closet: any): Closet {
        return {
            id: Number(closet.id),
            name: closet.name,
            description: closet.description,
            isPublic: closet.isPublic,
            createdAt: closet.createdAt,
            userId: closet.userId,
            fromDatabase: "PostgreSQL"
        };
    }

    private formatUserOutfit(outfit: any): Outfit {
        return {
            id: Number(outfit.id),
            name: outfit.name,
            style: outfit.style,
            datedAdded: outfit.dateAdded,
            createdBy: outfit.createdBy,
            items: outfit.outfitItems?.map((outfitItem: any) => this.formatClothingItem(outfitItem.closetItem?.item)) || [],
            reviews: outfit.reviews?.map((review: any) => this.formatUserReview(review)) || [],
            fromDatabase: "PostgreSQL"
        };
    }

    private formatClothingItem(item: any): ClothingItem {
        const itemBrandRelation = item.itemBrand?.[0];
        const brand = itemBrandRelation?.brand;

        return {
            id: Number(item.id),
            name: item.name,
            price: item.price,
            category: item.category.name,
            brand: this.formatBrand(brand),
            images: item.image?.map((img: any) => this.formatItemImage(img)) || []
        };
    }

    private formatItemImage(image: any): ItemImage {
        return {
            id: Number(image.id),
            url: image.url
        };
    }

    private formatBrand(brand: any): Brand {
        if (!brand) {
            return {
                id: 0,
                name: 'Unknown',
                // country: {
                //     id: 0,
                //     name: 'Unknown',
                //     countryCode: ''
                // }
            };
        }

        return {
            id: Number(brand.id),
            name: brand.name,
            // country: {
            //     id: brand.country.id,
            //     name: brand.country.name,
            //     countryCode: brand.country.countryCode
            // }
        };
    }


    private formatUserReview(review: any): Review {
        return {
            id: Number(review.id),
            score: review.score,
            text: review.text,
            dateWritten: review.dateWritten,
            writtenBy: review.writtenBy,
            fromDatabase: "PostgreSQL"
        };
    }

    private formatUserSharedCloset(closet: any): SharedCloset {
        return {
            id: Number(closet.id),
            name: closet.name,
            description: closet.description,
            isPublic: closet.isPublic,
            createdAt: closet.createdAt,
            userId: closet.userId, // owner of the closet
            sharedWith: closet.sharedCloset?.map((shared: any) => shared.userId) || [], // users the closet is shared with
            itemIds: closet.closetItem?.map((item: any) => Number(item.id)) || [],
            fromDatabase: "PostgreSQL"
        };
    }
    //---------------------------------------------------------------------------------------------
    // [END Helper Methods]
    //---------------------------------------------------------------------------------------------
}
