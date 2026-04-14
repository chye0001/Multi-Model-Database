import mongoose, { Schema, Document, Model } from "mongoose";
import { stripInternalIdField } from "../../../../utils/repository_utils/MongooseUtil.js";

const CompactUserSchema = {
  id:        { type: String, required: true },
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true }
};

export interface IReview {
  id: number;
  score: number;
  text: string;
  writtenBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  dateWritten?: Date;
}

export interface IOutfit extends Document {
  id: number;
  name: string;
  style: string;
  dateAdded: Date;
  createdBy: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  items: {
    id: number;
    name: string;
    price: number | null;
    category: { categoryId: number; name: string };
    brands: { id: number; name: string; country: { id: number; name: string; countryCode: string } }[];
    images: { id: number; url: string }[];
  }[];
  reviews: IReview[];
}

const ReviewSchema = new Schema<IReview>(
  {
    id:          { type: Number, required: true },
    score:       { type: Number, required: true, min: 1, max: 5 },
    text:        { type: String, required: true, trim: true },
    writtenBy:   CompactUserSchema,
    dateWritten: { type: Date, default: Date.now },
  },
  { _id: false }
);

const OutfitSchema = new Schema<IOutfit>(
  {
    id:        { type: Number, required: true, unique: true },
    name:      { type: String, required: true, trim: true },
    style:     { type: String, required: true, trim: true },
    createdBy: CompactUserSchema,
    items: [
      {
        id:    { type: Number, required: true },
        name:  { type: String, required: true },
        price: { type: Number, default: null },
        category: {
          categoryId: { type: Number },
          name:       { type: String }
        },
        brands: [
          {
            id:   { type: Number },
            name: { type: String },
            country: {
              id:          { type: Number },
              name:        { type: String },
              countryCode: { type: String }
            }
          }
        ],
        images: [
          {
            id:  { type: Number, required: true },
            url: { type: String, required: true, trim: true }
          }
        ]
      }
    ],
    reviews: [ReviewSchema],
  },
  {
    timestamps: { createdAt: "dateAdded", updatedAt: false },
    versionKey: false,
    id: false,
    toJSON: { transform: stripInternalIdField }
  }
);

export const Outfit: Model<IOutfit> =
  mongoose.models.Outfit ?? mongoose.model<IOutfit>("Outfit", OutfitSchema);