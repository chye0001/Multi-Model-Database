import mongoose, { Schema, Document, Model } from "mongoose";
import { stripInternalIdField } from "../../../../utils/repository_utils/MongooseUtil.js";

export interface ISharedWith {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

const SharedWithSchema = new Schema<ISharedWith>(
  {
    id:        { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false }
);

export interface ICloset extends Document {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  userId: mongoose.Types.ObjectId;
  itemIds: mongoose.Types.ObjectId[];
  sharedWith: ISharedWith[];
}

const ClosetSchema = new Schema<ICloset>(
  {
    id:          { type: Number, required: true, unique: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    isPublic:    { type: Boolean, required: true, default: false },
    userId:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    itemIds:     [{ type: Schema.Types.ObjectId, ref: "Item" }],
    sharedWith:  [SharedWithSchema],
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    id: false,
    toJSON: { transform: stripInternalIdField }
  }
);

export const Closet: Model<ICloset> =
  mongoose.models.Closet ?? mongoose.model<ICloset>("Closet", ClosetSchema);