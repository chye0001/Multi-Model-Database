import { User, Closet, Outfit, Role, Country } from "../../database/mongo/models/index.js";
import { formatUser, formatUserCloset, formatUserOutfit, formatUserReview } from "../../utils/repository_utils/ObjectFormatters.js";
import { audit } from "../../utils/audit/AuditLogger.js";
import type { IUserRepository } from '../interfaces/IUserRepository.js';
import type { CreateUserRequest, UpdateUserRequest, User as UserDto } from "../../dtos/users/User.dto.js";
import type { Closet as ClosetDto } from "../../dtos/closets/Closet.dto.js";
import type { Outfit as OutfitDto } from "../../dtos/outfits/Outfit.dto.js";

export class MongoUserRepository implements IUserRepository {

    async getAllUsers(): Promise<UserDto[]> {
        try {
            const users = await User.find()
                .lean()
                .exec();

            return users.map(user => formatUser(user, "MongoDB"));

        } catch (error) {
            console.error("Error fetching users from MongoDB:", error);
            throw new Error("Failed to fetch users from MongoDB");
        }
    }

    async getUserById(id: string): Promise<UserDto[]> {
        try {
            const user = await User.findOne({ id })
                .lean()
                .exec();

            if (!user) return [];

            return [formatUser(user, "MongoDB")];

        } catch (error) {
            console.error(`Error fetching user with id ${id} from MongoDB:`, error);
            throw new Error("Failed to fetch user from MongoDB");
        }
    }

    async createUser(data: CreateUserRequest): Promise<UserDto[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'DOCUMENT_CREATE',
            label: 'User',
            params: { id: data.id, email: data.email, firstName: data.firstName, lastName: data.lastName, countryId: data.countryId },
            source: 'MongoUserRepository.createUser',
        });

        try {
            const defaultUserRole = { id: 2, name: "user" };

            const country = await Country.findOne({ id: data.countryId }).lean().exec();
            if (!country) throw new Error(`Country with id ${data.countryId} not found`);

            const newUser = new User({
                id:        data.id,
                email:     data.email,
                firstName: data.firstName,
                lastName:  data.lastName,
                password:  data.password,
                role:      defaultUserRole,
                country: {
                    id:          country.id,
                    name:        country.name,
                    countryCode: country.countryCode,
                },
            });

            const savedUser = await newUser.save();
            return this.getUserById(savedUser.id);
        } catch (error) {
            console.error("Error creating user in MongoDB:", error);
            throw new Error("Failed to create user in MongoDB");
        }
    }

    async updateUser(id: string, data: UpdateUserRequest): Promise<UserDto[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'DOCUMENT_UPDATE',
            label: 'User',
            params: { id, ...data },
            source: 'MongoUserRepository.updateUser',
        });

        try {
            if (!data.firstName || !data.lastName || !data.countryId) {
                throw new Error(`Missing required data to update. Data received: ${JSON.stringify(data)}`);
            }

            // Same as createUser — resolve the country snapshot from the source of truth
            const country = await Country.findOne({ id: data.countryId }).lean().exec();
            if (!country) {
                throw new Error(`Country with id ${data.countryId} not found`);
            }

            const updatedUser = await User.findOneAndUpdate(
                { id },
                {
                    firstName: data.firstName,
                    lastName:  data.lastName,
                    country: {
                        id:          country.id,
                        name:        country.name,
                        countryCode: country.countryCode,
                    },
                },
                { new: true }
            ).lean().exec();

            if (!updatedUser) throw new Error("User not found");

            return [formatUser(updatedUser, "MongoDB")];

        } catch (error) {
            console.error(`Error updating user with id ${id} in MongoDB:`, error);
            throw new Error("Failed to update user in MongoDB");
        }
    }

    async deleteUser(id: string): Promise<void> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'DOCUMENT_DELETE',
            label: 'User',
            params: { id },
            source: 'MongoUserRepository.deleteUser',
        });

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

    async assignRole(userEmail: string, roleName: string): Promise<UserDto[]> {
        audit({
            timestamp: new Date().toISOString(),
            event: 'DOCUMENT_UPDATE',
            label: 'User.role',
            params: { userEmail, roleName },
            source: 'MongoUserRepository.assignRole',
        });

        try {
            const role = await Role.findOne({ name: roleName }).lean().exec();
            if (!role) throw new Error(`Role "${roleName}" not found`);

            const updated = await User.findOneAndUpdate(
                { email: userEmail },
                { role: { id: role.id, name: role.name } },
                { new: true }
            ).lean().exec();

            if (!updated) throw new Error("User not found");

            return [formatUser(updated, "MongoDB")];

        } catch (error) {
            console.error(`Error assigning role to user with email ${userEmail} in MongoDB:`, error);
            throw new Error("Failed to assign role in MongoDB");
        }
    }

    async getAllUserClosets(userId: string): Promise<ClosetDto[]> {
        try {
            const foundUser = await User.findOne({ id: userId }).lean().exec();
            if (!foundUser) return [];

            // itemIds are references — populate to get full item documents
            // userId is still a reference — populate to get the owner
            const userClosets = await Closet.find({ userId: foundUser._id })
                .populate("userId")
                .populate("itemIds")
                .lean()
                .exec();

            // sharedWith is now an embedded snapshot — no manual resolution needed
            return userClosets.map(closet => formatUserCloset(closet, "mongodb"));

        } catch (error) {
            console.error(`Error fetching closets for user ${userId} from MongoDB:`, error);
            throw new Error("Failed to fetch user closets from MongoDB");
        }
    }

    async getAllOutfitsByUserId(userId: string): Promise<OutfitDto[]> {
        try {
            const foundUser = await User.findOne({ id: userId }).lean().exec();
            if (!foundUser) return [];

            // createdBy is now an embedded snapshot, items are embedded in Outfit
            // so no population needed at all
            const outfits = await Outfit.find({ "createdBy.id": foundUser.id })
                .lean()
                .exec();

            return outfits.map(outfit => formatUserOutfit(outfit, "mongodb"));

        } catch (error) {
            console.error(`Error fetching outfits for user ${userId} from MongoDB:`, error);
            throw new Error("Failed to fetch outfits from MongoDB");
        }
    }

    async getAllReviewsByUserId(userId: string): Promise<any[]> {
        try {
            const foundUser = await User.findOne({ id: userId }).lean().exec();
            if (!foundUser) return [];

            // writtenBy is now an embedded snapshot with id field
            const outfits = await Outfit.find({ "reviews.writtenBy.id": foundUser.id })
                .lean()
                .exec();

            const reviews = outfits.flatMap((outfit) =>
                outfit.reviews
                    .filter((review) => review.writtenBy.id === foundUser.id)
                    .map((review) => ({
                        ...review,
                        outfitId: outfit.id,
                    }))
            );

            return reviews.map(review => formatUserReview(review, "mongodb"));

        } catch (error) {
            console.error(`Error fetching reviews for user ${userId} from MongoDB:`, error);
            throw new Error("Failed to fetch reviews from MongoDB");
        }
    }

    async getAllSharedClosetsByUserId(userId: string): Promise<ClosetDto[]> {
        try {
            const foundUser = await User.findOne({ id: userId }).lean().exec();
            if (!foundUser) return [];

            // sharedWith is now embedded with id field directly — no userId sub-field
            const sharedClosets = await Closet.find({ "sharedWith.id": foundUser.id })
                .populate("userId")
                .populate("itemIds")
                .lean()
                .exec();

            return sharedClosets.map(closet => formatUserCloset(closet, "mongodb"));

        } catch (error: any) {
            console.error(`Failed to fetch shared closets for userId: ${userId}`);
            throw new Error(`Failed to fetch shared closets for userId: ${userId}`);
        }
    }
}
