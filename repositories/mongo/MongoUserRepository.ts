import { use } from "react";
import { User, Closet, Country, Outfit, Brand } from "../../database/mongo/models/index.js";
import type { IUser } from "../../database/mongo/models/index.js";

import { formatUser, formatUserCloset, formatUserOutfit, formatUserReview } from "../../utils/repository_utils/ObjectFormatters.js";

import type { IUserRepository } from '../interfaces/IUserRepository.js';
import type { UpdateUserData, User as UserDto } from "../../dtos/users/User.dto.js";
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

    async createUser(data: Partial<IUser> & { roleId?: number; countryId?: any; roleName?: string }): Promise<UserDto[]> {
        try {
            const role = this.buildRole(data);
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
                role,
                country
            });

            const savedUser = await newUser.save();

            return this.getUserById(savedUser.id);

        } catch (error) {
            console.error("Error creating user in MongoDB:", error);
            throw new Error("Failed to create user in MongoDB");
        }
    }

    async updateUser(id: string, data: Partial<UpdateUserData>): Promise<UserDto[]> {
        try {
 
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

            // Find closets owned by this user where sharedWith has at least one entry
            const sharedClosets = await Closet.find({
                userId: foundUser._id,
                    "sharedWith.0": { $exists: true }, // at least one entry in sharedWith
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
            console.error(`Failed to fetch all shared closets owned by userId: ${userId}.`);
            throw new Error(`Failed to fetch all shared closets owned by userId: ${userId}.`, error);
        }
    }



    //---------------------------------------------------------------------------------------------
    // [START Helper Methods]
    //---------------------------------------------------------------------------------------------
    private buildRole(data: Partial<IUser> & { roleId?: number; roleName?: string }) {
        if (data.role && typeof data.role === "object" && "id" in data.role && "name" in data.role) {
            return data.role;
        }

        const roleId = data.roleId ?? 2;
        const roleName = data.roleName ?? this.getRoleName(roleId);

        return {
            id: roleId,
            name: roleName,
        };
    }

    private getRoleName(roleId: number) {
        switch (roleId) {
            case 1:
                return "admin";
            case 3:
                return "moderator";
            default:
                return "user";
        }
    }

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
