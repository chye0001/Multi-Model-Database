import { User } from "../../database/mongo/models/users/User.model.js";
import type { IUser } from "../../database/mongo/models/users/User.model.js";

import { Closet } from "../../database/mongo/models/closets/Closet.model.js";

import type { IUserRepository } from '../interfaces/IUserRepository.js';

export class MongoUserRepository implements IUserRepository {
    async getAllUsers(): Promise<any[]> {
        try {
            const users = await User.find()
            // .populate("countryId") // Fetches the full Country document
            .lean()              // Returns plain JS objects (faster and easier to map)
            .exec();

            const modifiedUsers = users.map(user => {
                //@ts-ignore just to distinguish the source of the data
                user.fromDatabase = "MongoDB";
                return user;
            });
            return modifiedUsers;

        } catch (error) {
            console.error("Error fetching users from MongoDB:", error);
            throw new Error("Failed to fetch users from MongoDB");
        }
    }

    async getUserById(id: string): Promise<any> {
        try {
            return await User.findOne({ id })
            .populate("countryId")
            .lean()
            .exec();

        } catch (error) {
            console.error(`Error fetching user with id ${id} from MongoDB:`, error);
            throw new Error("Failed to fetch user from MongoDB");
        }
    }

    async createUser(data: Partial<IUser>): Promise<IUser[]> {
        try {
            const newUser = new User(data);
            const savedUser = await newUser.save();
            return [savedUser];
            
        } catch (error) {
            console.error("Error creating user in MongoDB:", error);
            throw new Error("Failed to create user in MongoDB");
        }
    }

    async updateUser(id: string, data: Partial<IUser>): Promise<IUser[]> {
        try {
            const updatedUser = await User.findOneAndUpdate({ id }, data, { new: true }).lean().exec();
            if (!updatedUser) {
                throw new Error("User not found");
            }
            return [updatedUser];

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

    async getAllUserClosets(userId: string): Promise<any[]> {
        try {
            const userClosets = await Closet.find({ userId: userId }).exec();
            return userClosets;

        } catch (error) {
            console.error(`Error fetching closets for user with id ${userId} from MongoDB:`, error);
            throw new Error("Failed to fetch user closets from MongoDB");
        }
    }

    async getAllOutfitsByUserId(userId: string): Promise<any[]> {
        // Similar to getAllUserClosets, you would fetch outfits based on the userId
        return [];
    }

    async getAllReviewsByUserId(userId: string): Promise<any[]> {
        // Similar to getAllUserClosets, you would fetch reviews based on the userId
        return [];
    }

    async getAllSharedClosetsByUserId(userId: string): Promise<any[]> {
        // Similar to getAllUserClosets, you would fetch shared closets based on the userId
        return [];
    }
}
