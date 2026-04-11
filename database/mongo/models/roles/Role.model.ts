import mongoose, { Schema, type Model } from "mongoose";

export interface IMongoRole {
  id: number;
  name: string;
}

const RoleSchema = new Schema<IMongoRole>(
  {
    id:   { type: Number, required: true, unique: true },
    name: { type: String, required: true, unique: true, lowercase: true, trim: true },
  },
  { versionKey: false, id: false }
);

export const Role: Model<IMongoRole> =
  mongoose.models["Role"] ?? mongoose.model<IMongoRole>("Role", RoleSchema);
