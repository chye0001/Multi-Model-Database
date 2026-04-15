import mongoose, { Schema, Document, Model } from "mongoose";
import { stripInternalIdField } from "../../../../utils/repository_utils/MongooseUtil.js";

export interface IEmbeddedCountry {
  id: number;
  name: string;
  countryCode: string;
}

const EmbeddedCountrySchema = new Schema<IEmbeddedCountry>(
  {
    id:          { type: Number, required: true },
    name:        { type: String, required: true, trim: true },
    countryCode: { type: String, required: true, trim: true, uppercase: true },
  },
  { _id: false }
);

export interface IBrand extends Document {
  id: number;
  name: string;
  country: IEmbeddedCountry;
}

const BrandSchema = new Schema<IBrand>(
  {
    id:      { type: Number, required: true, unique: true },
    name:    { type: String, required: true, trim: true },
    country: { type: EmbeddedCountrySchema, required: true },
  },
  {
    versionKey: false,
    id: false,
    toJSON: { transform: stripInternalIdField }
  }
);

export const Brand: Model<IBrand> =
  mongoose.models.Brand ?? mongoose.model<IBrand>("Brand", BrandSchema);