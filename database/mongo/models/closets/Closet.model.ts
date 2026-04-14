import mongoose, { Schema, Document, Model } from "mongoose";
import { stripInternalIdField } from "../../../../utils/repository_utils/MongooseUtil.js";

// ── Embedded sub-document interfaces ────────────────────────────────────────

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

export interface IEmbeddedImage {
  id: number;
  url: string;
}

const EmbeddedImageSchema = new Schema<IEmbeddedImage>(
  {
    id:  { type: Number, required: true },
    url: { type: String, required: true, trim: true },
  },
  { _id: false }
);

export interface IEmbeddedItem {
  id: number;
  name: string;
  price: number | null;
  category: IEmbeddedCategory;
  brands: IEmbeddedBrand[];
  images: IEmbeddedImage[];
}

const EmbeddedItemSchema = new Schema<IEmbeddedItem>(
  {
    id:       { type: Number, required: true },
    name:     { type: String, required: true, trim: true },
    price:    { type: Number, default: null },
    category: { type: EmbeddedCategorySchema, required: true },
    brands:   [EmbeddedBrandSchema],
    images:   [EmbeddedImageSchema],
  },
  { _id: false }
);

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

// ── Main document interface ──────────────────────────────────────────────────

export interface ICloset extends Document {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdAt: Date;
  userId: mongoose.Types.ObjectId;
  items: IEmbeddedItem[];
  sharedWith: ISharedWith[];
}

const ClosetSchema = new Schema<ICloset>(
  {
    id:          { type: Number, required: true, unique: true },
    name:        { type: String, required: true, trim: true },
    description: { type: String, default: null, trim: true },
    isPublic:    { type: Boolean, required: true, default: false },
    userId:      { type: Schema.Types.ObjectId, ref: "User", required: true },
    items:       [EmbeddedItemSchema],
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