import mongoose, { Schema, Document, Model } from "mongoose";
import { stripInternalIdField } from "../../../../utils/repository_utils/MongooseUtil.js";

export interface IReview {
  id: number;
  score: number;
  text: string;
  writtenBy: mongoose.Types.ObjectId;
  dateWritten?: Date;
}

export interface IOutfit extends Document {
  id: number;
  name: string;
  style: string;
  dateAdded: Date;
  createdBy: mongoose.Types.ObjectId;
  itemIds: mongoose.Types.ObjectId[];
  reviews: IReview[];
}

const ReviewSchema = new Schema<IReview>(
  {
    id:        { type: Number, required: true, unique: true },
    score:     { type: Number, required: true, min: 1, max: 5 },
    text:      { type: String, required: true, trim: true },
    writtenBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    dateWritten: { type: Date, default: Date.now },
  },
  {
    _id: false, // embedded sub-document, no own ObjectId needed
  }
);

const OutfitSchema = new Schema<IOutfit>(
  {
    id:        { type: Number, required: true, unique: true },
    name:      { type: String, required: true, trim: true },
    style:     { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    itemIds:   [{ type: Schema.Types.ObjectId, ref: "Item" }],
    reviews:   [ReviewSchema],
  },
  {
    timestamps: { createdAt: "dateAdded", updatedAt: false },
    versionKey: false,
     // 1. Disable the built-in Mongoose 'id' virtual to avoid conflict with your UUID 'id'
    id: false, 
    toJSON: { transform: stripInternalIdField }
  }
);

export const Outfit: Model<IOutfit> =
  mongoose.models.Outfit ?? mongoose.model<IOutfit>("Outfit", OutfitSchema);