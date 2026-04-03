import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBrand extends Document {
  id: string;
  name: string;
  countryId: mongoose.Types.ObjectId;
}

const BrandSchema = new Schema<IBrand>(
  {
    id:        { type: String, required: true, unique: true },
    name:      { type: String, required: true, trim: true },
    countryId: { type: Schema.Types.ObjectId, ref: "Country", required: true },
  },
  {
    versionKey: false,
     // 1. Disable the built-in Mongoose 'id' virtual to avoid conflict with your UUID 'id'
    id: false, 
  }
);

export const Brand: Model<IBrand> =
  mongoose.models.Brand ?? mongoose.model<IBrand>("Brand", BrandSchema);