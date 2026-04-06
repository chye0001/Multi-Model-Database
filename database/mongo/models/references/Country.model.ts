import mongoose, { Schema, Document, Model } from "mongoose";
import { stripInternalIdField } from "../../../../utils/repository_utils/MongooseUtil.js";



export interface ICountry extends Document {
  id: number;
  name: string;
  countryCode: string;
}

const CountrySchema = new Schema<ICountry>(
  {
    id:          { type: Number, required: true, unique: true },
    name:        { type: String, required: true, trim: true },
    countryCode: { type: String, required: true, trim: true, uppercase: true },
  },
  {
    versionKey: false,
   // 1. Disable the built-in Mongoose 'id' virtual to avoid conflict with your UUID 'id'
    id: false, 
    toJSON: { transform: stripInternalIdField }
  }
);

export const Country: Model<ICountry> =
  mongoose.models.Country ?? mongoose.model<ICountry>("Country", CountrySchema);
  