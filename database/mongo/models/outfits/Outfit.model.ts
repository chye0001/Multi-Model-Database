import mongoose, { Schema, Document, Model } from "mongoose";

export interface IReview {
  id: string;
  score: number;
  text: string;
  writtenBy: mongoose.Types.ObjectId;
}

export interface IOutfit extends Document {
  id: string;
  name: string;
  style: string;
  dateAdded: Date;
  createdBy: mongoose.Types.ObjectId;
  itemIds: mongoose.Types.ObjectId[];
  reviews: IReview[];
}

const ReviewSchema = new Schema<IReview>(
  {
    id:        { type: String, required: true },
    score:     { type: Number, required: true, min: 1, max: 5 },
    text:      { type: String, required: true, trim: true },
    writtenBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  {
    _id: false, // embedded sub-document, no own ObjectId needed
  }
);

const OutfitSchema = new Schema<IOutfit>(
  {
    id:        { type: String, required: true, unique: true },
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
  }
);

export const Outfit: Model<IOutfit> =
  mongoose.models.Outfit ?? mongoose.model<IOutfit>("Outfit", OutfitSchema);