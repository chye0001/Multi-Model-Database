import mongoose, { Schema, Document, Model } from "mongoose";
import { stripInternalIdField } from "../../../../utils/repository_utils/MongooseUtil.js";

export interface IEmbeddedCategory {
  categoryId: number;
  name: string;
}

const EmbeddedCategorySchema = new Schema<IEmbeddedCategory>(
  {
    categoryId: { type: Number, required: true },
    name:       { type: String, required: true, trim: true },
  },
  { _id: false }
);

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

export interface IEmbeddedBrand {
  id: number;
  name: string;
  country: IEmbeddedCountry;
}

const EmbeddedBrandSchema = new Schema<IEmbeddedBrand>(
  {
    id:      { type: Number, required: true },
    name:    { type: String, required: true, trim: true },
    country: { type: EmbeddedCountrySchema, required: true },
  },
  { _id: false }
);

export interface IImage {
  id: number;
  url: string;
}

const ImageSchema = new Schema<IImage>(
  {
    id:  { type: Number, required: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

export interface IItem extends Document {
  id: number;
  name: string;
  price: number | null;
  category: IEmbeddedCategory;
  brands: IEmbeddedBrand[];
  images: IImage[];
}

const ItemSchema = new Schema<IItem>(
  {
    id:       { type: Number, required: true, unique: true },
    name:     { type: String, required: true, trim: true },
    price: { type: Number, default: null, index: true, sparse: true },
    category: { type: EmbeddedCategorySchema, required: true },
    brands:   [EmbeddedBrandSchema],
    images:   [ImageSchema],
  },
  {
    versionKey: false,
    id: false,
    toJSON: { transform: stripInternalIdField }
  }
);

export const Item: Model<IItem> =
  mongoose.models.Item ?? mongoose.model<IItem>("Item", ItemSchema);