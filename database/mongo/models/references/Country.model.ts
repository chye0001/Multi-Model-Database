import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICountry extends Document {
  id: string;
  name: string;
  countryCode: string;
}

const CountrySchema = new Schema<ICountry>(
  {
    id:          { type: String, required: true, unique: true },
    name:        { type: String, required: true, trim: true },
    countryCode: { type: String, required: true, trim: true, uppercase: true },
  },
  {
    versionKey: false,
   // 1. Disable the built-in Mongoose 'id' virtual to avoid conflict with your UUID 'id'
    id: false, 
  }
);

export const Country: Model<ICountry> =
  mongoose.models.Country ?? mongoose.model<ICountry>("Country", CountrySchema);
  