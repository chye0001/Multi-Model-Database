import { use } from "react";
import { User, Closet, Country, Outfit, Brand, Role } from "../../database/mongo/models/index.js";
import type { IUser } from "../../database/mongo/models/index.js";

import { formatUser, formatUserCloset, formatUserOutfit, formatUserReview } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IUserRepository } from '../interfaces/IUserRepository.js';
import type { CreateUserRequest, UpdateUserRequest, User as UserDto } from "../../dtos/users/User.dto.js";
import type { Closet as ClosetDto } from "../../dtos/closets/Closet.dto.js";
import type { Outfit as OutfitDto } from "../../dtos/outfits/Outfit.dto.js";

export class MongoUserRepository implements IUserRepository {
    async getAllUsers(): Promise<UserDto[]> {
        try {
            const users = await User.find()
            .populate("country") // Fetches the full Country document
            .lean()              // Returns plain JS objects (faster and easier to map)
            .exec();

            const modifiedUsers = users.map(user => {
                return formatUser(user, "MongoDB");
            });

            return modifiedUsers;

        } catch (error) {
            console.error("Error fetching users from MongoDB:", error);
            throw new Error("Failed to fetch users from MongoDB");
        }
    }

    async getUserById(id: string): Promise<UserDto[]> {
        try {
            const user = await User.findOne({ id })
                .populate("country")
                .lean()
                .exec();

            if (!user) {
                return [];
            }

            return [formatUser(user, "MongoDB")];

        } catch (error) {
            console.error(`Error fetching user with id ${id} from MongoDB:`, error);
            throw new Error("Failed to fetch user from MongoDB");
        }
    }

    async createUser(data: CreateUserRequest): Promise<UserDto[]> {
        try {
            const defualtUserRole = {
                id: 2,
                name: "user"
            };
            
            const countryId = data.countryId;
            let country = countryId
            ? await Country.findOne({ id: countryId }).lean().exec()
            : null;

            //@ts-ignore
            country = country ?? data.country ?? null;
            if (!country) {
                throw new Error(`Country could not be resolved — provide a valid countryId or a country object.`);
            }

            const newUser = new User({
                id: data.id,
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                role: defualtUserRole,
                country
            });

            const savedUser = await newUser.save();

            return this.getUserById(savedUser.id);

        } catch (error) {
            console.error("Error creating user in MongoDB:", error);
            throw new Error("Failed to create user in MongoDB");
        }
    }

    async updateUser(id: string, data: UpdateUserRequest): Promise<UserDto[]> {
        try {
            if ( !data.firstName || !data.lastName || !data.countryId) {
                throw new Error(`Missing required data to update. Data recived: ${data}`)
            }

            let country = data.countryId
                ? await Country.findOne({ id: data.countryId }).lean().exec()
                : null;

            //@ts-ignore
            country = country ?? data.country ?? null;
            if (!country) {
                throw new Error(`Country could not be resolved — provide a valid countryId or a country object.`);
            }

            data.country = country._id;
            
            
            const updatedUser = await User.findOneAndUpdate({ id }, data, { new: true }).populate("country").lean().exec();
            if (!updatedUser) {
                throw new Error("User not found");
            }

            return [formatUser(updatedUser, "mongoDB")];

        } catch (error) {
            console.error(`Error updating user with id ${id} in MongoDB:`, error);
            throw new Error("Failed to update user in MongoDB");
        }
    }

    async deleteUser(id: string): Promise<void> {
        try {
            const result = await User.deleteOne({ id }).exec();
            if (result.deletedCount === 0) {
                throw new Error("User not found");
            }

        } catch (error) {
            console.error(`Error deleting user with id ${id} from MongoDB:`, error);
            throw new Error("Failed to delete user from MongoDB");
        }
    }

    async assignRole(userEmail: string, roleName: string): Promise<any[]> {
        try {
            const role = await Role.findOne({ name: roleName }).lean().exec();
            if (!role) throw new Error(`Role "${roleName}" not found`);

            const updated = await User.findOneAndUpdate(
                { email: userEmail },
                { role: { id: role.id, name: role.name } },
                { new: true }
            ).populate('country').lean().exec();

            if (!updated) throw new Error(`User not found`);
            return [formatUser(updated, 'MongoDB')];
        } catch (error) {
            console.error(`Error assigning role to user with email ${userEmail} in MongoDB:`, error);
            throw new Error('Failed to assign role in MongoDB');
        }
    }

    async getAllUserClosets(userId: string): Promise<ClosetDto[]> {
        try {
            const foundUser = await User.findOne({ id: userId }).lean().exec();
            if (!foundUser) {
                // throw new Error(`User with id ${userId} not found`);
                return [];
            }

            const userClosets = await Closet.find({ userId: foundUser._id })
                .populate("userId")
                .populate("itemIds")
                .lean()
                .exec();

            const populatedClosets = await this.populateSharedWith(userClosets);
            return populatedClosets.map(closet => formatUserCloset(closet, "mongodb"));


        } catch (error) {
            console.error(`Error fetching closets for user with id ${userId} from MongoDB:`, error);
            throw new Error("Failed to fetch user closets from MongoDB");
        }
    }

    async getAllOutfitsByUserId(userId: string): Promise<OutfitDto[]> {
        try {
            const foundUser = await User.findOne({ id: userId }).lean().exec();
            if (!foundUser) {
                return [];
            }

            const outfits = await Outfit.find({ createdBy: foundUser._id })
                .populate("createdBy")
                .populate("itemIds")
                .lean()
                .exec();

        const populatedOutfits = await this.populateReviews(outfits);

        const fullyPopulated = await Promise.all(
            populatedOutfits.map(async (outfit) => ({
                ...outfit,
                itemIds: await this.populateBrands(outfit.itemIds),
            }))
        );

        return fullyPopulated.map(outfit => formatUserOutfit(outfit, "mongodb"));

        } catch (error) {
            console.error(`Error fetching outfits for user ${userId} from MongoDB:`, error);
            throw new Error("Failed to fetch outfits from MongoDB");
        }
    }

    async getAllReviewsByUserId(userId: string): Promise<any[]> {
        try {
            const foundUser = await User.findOne({ id: userId }).lean().exec();
            if (!foundUser) {
            // throw new Error(`User with id ${userId} not found`);
                return [];
            }

            const outfits = await Outfit.find({ "reviews.writtenBy": foundUser._id })
                .populate("createdBy")
                .lean()
                .exec();

            const reviews = outfits.flatMap((outfit) =>
                outfit.reviews
                    .filter((review) => review.writtenBy.toString() === foundUser._id.toString())
                    .map((review) => ({ 
                        ...review, 
                        outfitId: outfit.id,
                        writtenBy: foundUser.id
                     }))
                );

            return reviews.map((review) => formatUserReview(review, "mongodb"));

        } catch (error) {
            console.error(`Error fetching reviews for user ${userId} from MongoDB:`, error);
            throw new Error("Failed to fetch reviews from MongoDB");
        }
    }

    async getAllSharedClosetsByUserId(userId: string): Promise<any[]> {
        try {
            const foundUser = await User.findOne({ id: userId }).lean().exec();
            if (!foundUser) {
                // throw new Error(`User with id ${userId} not found`);
                return [];
            }

            // Find closets where this user is in the sharedWith array
            const sharedClosets = await Closet.find({
                "sharedWith.userId": foundUser._id,
                })
                .populate("userId")
                .populate("itemIds")
                .lean()
                .exec();

            const populatedClosets = await this.populateSharedWith(sharedClosets);
            const populatedItems = await Promise.all(
                populatedClosets.map(async (closet) => ({
                    ...closet,
                    itemIds: await this.populateBrands(closet.itemIds),
                }))
            );

            return populatedItems.map((closet) => formatUserCloset(closet, "mongodb"));

        } catch (error: any) {
            console.error(`Failed to fetch all shared closets for userId: ${userId}.`);
            throw new Error(`Failed to fetch all shared closets for userId: ${userId}.`, error);
        }
    }



    //---------------------------------------------------------------------------------------------
    // [START Helper Methods]
    //---------------------------------------------------------------------------------------------

    async resolveSharedWith(sharedWith: any[]): Promise<any[]> {
        return Promise.all(
            sharedWith.map(async (entry) => {
                const sharedUser = await User.findOne({ _id: entry.userId })
                    .select("id")
                    .lean()
                    .exec();
                return { user: sharedUser };
            })
        );
        }

    async populateSharedWith(closets: any[]): Promise<any[]> {
        return Promise.all(
            closets.map(async (closet) => ({
                ...closet,
                sharedWith: await this.resolveSharedWith(closet.sharedWith),
            }))
        );
    }

    async populateBrands(items: any[]): Promise<any[]> {
        return Promise.all(
            items.map(async (item) => {
                const brands = await Promise.all(
                    item.brandIds.map((brandId: any) =>
                    Brand.findOne({ _id: brandId })
                        .select("id name")
                        .lean()
                        .exec()
                    )
                );
                return { ...item, brands };
            })
        );
    }

    async resolveReviews(reviews: any[]): Promise<any[]> {
        return Promise.all(
            reviews.map(async (review) => {
                const writtenBy = await User.findOne({ _id: review.writtenBy })
                    .select("id email firstName lastName")
                    .lean()
                    .exec();
                return { ...review, writtenBy };
            })
        );
    }

    async populateReviews(outfits: any[]): Promise<any[]> {
        return Promise.all(
            outfits.map(async (outfit) => ({
                ...outfit,
                reviews: await this.resolveReviews(outfit.reviews),
            }))
        );
    }
    //---------------------------------------------------------------------------------------------
    // [END Helper Methods]
    //---------------------------------------------------------------------------------------------

}
