import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRole {
  name: string;
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true, trim: true, lowercase: true },
  },
  {
    _id: false, // embedded sub-document, no own ObjectId needed
  }
);




export interface IUser extends Document {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  role: IRole;
  countryId: mongoose.Types.ObjectId;
}

const UserSchema = new Schema<IUser>(
  {
    id:        { type: String, required: true, unique: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    role:      { type: RoleSchema, required: true },
    countryId: { type: Schema.Types.ObjectId, ref: "Country", required: true },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false,
    // 1. Disable the built-in Mongoose 'id' virtual to avoid conflict with your UUID 'id'
    id: false, 
  }
);

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
  