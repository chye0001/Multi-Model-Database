import mongoose, { Schema, Document, Model } from "mongoose";
import { stripInternalIdField } from "../../../../utils/repository_utils/MongooseUtil.js";

// Embedded sub-document interfaces
export interface IEmbeddedRole {
  id: number;
  name: string;
}

export interface IEmbeddedCountry {
  id: number;
  name: string;
  countryCode: string;
}

const EmbeddedRoleSchema = new Schema<IEmbeddedRole>(
  {
    id:   { type: Number, required: true },
    name: { type: String, required: true, trim: true, lowercase: true },
  },
  { _id: false }
);

const EmbeddedCountrySchema = new Schema<IEmbeddedCountry>(
  {
    id:          { type: Number, required: true },
    name:        { type: String, required: true, trim: true },
    countryCode: { type: String, required: true, trim: true, uppercase: true },
  },
  { _id: false }
);

export interface IUser extends Document {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  role: IEmbeddedRole;
  country: IEmbeddedCountry;
}

const UserSchema = new Schema<IUser>(
  {
    id:        { type: String, required: true, unique: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    role:      { type: EmbeddedRoleSchema, required: true },
    country:   { type: EmbeddedCountrySchema, required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    id: false,
    toJSON: { transform: stripInternalIdField }
  }
);

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);