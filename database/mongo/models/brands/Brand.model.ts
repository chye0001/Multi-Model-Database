import mongoose, { Schema, Document, Model } from "mongoose";
import { stripInternalIdField } from "../../../../utils/repository_utils/MongooseUtil.js";



export interface IBrand extends Document {
  id: number;
  name: string;
  countryId: mongoose.Types.ObjectId;
}

const BrandSchema = new Schema<IBrand>(
  {
    id:        { type: Number, required: true, unique: true },
    name:      { type: String, required: true, trim: true },
    countryId: { type: Schema.Types.ObjectId, ref: "Country", required: true },
  },
  {
    versionKey: false,
     // 1. Disable the built-in Mongoose 'id' virtual to avoid conflict with your UUID 'id'
    id: false, 
    toJSON: { transform: stripInternalIdField }
  }
);

export const Brand: Model<IBrand> =
  mongoose.models.Brand ?? mongoose.model<IBrand>("Brand", BrandSchema);