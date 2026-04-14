import mongoose, { Schema, Document, Model } from "mongoose";
import { stripInternalIdField } from "../../../../utils/repository_utils/MongooseUtil.js";

export interface IRole extends Document {
  id: number;
  name: string;
}

const RoleSchema = new Schema<IRole>(
  {
    id:   { type: Number, required: true, unique: true },
    name: { type: String, required: true, trim: true, lowercase: true },
  },
  {
    versionKey: false,
    id: false,
    toJSON: { transform: stripInternalIdField }
  }
);

export const Role: Model<IRole> =
  mongoose.models.Role ?? mongoose.model<IRole>("Role", RoleSchema);